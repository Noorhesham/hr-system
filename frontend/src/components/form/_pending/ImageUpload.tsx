"use client";

import React, { useState, useCallback, useRef, useId } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Loader2, Trash2, FileText, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useFormContext } from "react-hook-form";
import { FormField, FormItem, FormControl, FormMessage, FormLabel } from "@/components/ui/form";
import { useDispatch } from "react-redux";
import { uploadDocument } from "@/lib/redux/slices/uploadSlice";
import { formRtlClasses } from "@/lib/utils/formRtl";
import { UPLOAD_ACCEPT, UPLOAD_MAX_BYTES, validateUploadFile } from "@/lib/utils/validateUploadFile";
import { UploadIcon } from "@/app/auth/supplier/signup/_components/Icons";

type UploadStatus = "idle" | "uploading" | "uploaded" | "failed";

interface ImageUploadProps {
  value?: string | string[];
  onChange?: (value: string | string[]) => void;
  maxFiles?: number;
  className?: string;
  disabled?: boolean;
  name?: string;
  label?: React.ReactNode;
  optional?: boolean;
  required?: boolean;
  accept?: string;
  hideLabel?: boolean;
  _isNested?: boolean;
}

export function ImageUpload({
  value,
  onChange,
  maxFiles = 1,
  className,
  disabled = false,
  name,
  label,
  optional = false,
  required,
  accept = UPLOAD_ACCEPT,
  hideLabel = false,
  _isNested = false,
}: ImageUploadProps) {
  const t = useTranslations("FileUpload");
  const locale = useLocale();
  const rtl = formRtlClasses(locale);
  const formContext = useFormContext();
  const dispatch = useDispatch<any>();
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [failedMessage, setFailedMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const replacingRef = useRef(false);
  const fileInputLabel = typeof label === "string" ? label.trim() || t("browseFiles") : t("browseFiles");

  const urls = Array.isArray(value) ? value : value ? [value] : [];

  React.useEffect(() => {
    if (urls.length > 0) {
      setStatus("uploaded");
      setFailedMessage(null);
    }
  }, [urls.length]);

  const runUpload = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0 || disabled) return;

      const isReplacing = replacingRef.current;
      const remainingSlots = isReplacing ? maxFiles : maxFiles - urls.length;

      if (remainingSlots <= 0) {
        toast.warning(t("maxFilesWarning", { maxFiles }));
        return;
      }

      const filesToUpload = Array.from(files).slice(0, remainingSlots);
      setUploading(true);
      setStatus("uploading");
      setFailedMessage(null);

      try {
        const uploadedUrls: string[] = [];

        for (const file of filesToUpload) {
          const validation = validateUploadFile(file, accept, UPLOAD_MAX_BYTES);
          if (validation.valid === false) {
            throw new Error(
              validation.reason === "size"
                ? t("fileTooLarge", { fileName: file.name })
                : t("invalidFormat", { fileName: file.name }),
            );
          }

          const formData = new FormData();
          formData.append("file", file);

          const result = await dispatch(uploadDocument(formData as any));

          if (uploadDocument.rejected.match(result)) {
            throw new Error((result.payload as string) || t("uploadFailed"));
          }

          const fileUrl = result.payload?.file_url;
          if (fileUrl) {
            uploadedUrls.push(fileUrl);
          } else {
            throw new Error(t("urlRetrieveFailed"));
          }
        }

        const newUrls = isReplacing ? uploadedUrls : [...urls, ...uploadedUrls];
        const nextValue = maxFiles === 1 ? newUrls[0] || "" : newUrls;
        onChange?.(nextValue);
        setStatus("uploaded");
        toast.success(t("uploadSuccess", { count: filesToUpload.length }));
      } catch (error) {
        const message = error instanceof Error ? error.message : t("uploadFailed");
        setStatus("failed");
        setFailedMessage(message);
        toast.error(message);
      } finally {
        replacingRef.current = false;
        setUploading(false);
        if (inputRef.current) inputRef.current.value = "";
      }
    },
    [urls, maxFiles, onChange, disabled, dispatch, t, accept],
  );

  const handleRemove = useCallback(
    (index: number) => {
      const updatedUrls = urls.filter((_, i) => i !== index);
      onChange?.(maxFiles === 1 ? updatedUrls[0] || "" : updatedUrls);
      if (updatedUrls.length === 0) {
        setStatus("idle");
        setFailedMessage(null);
      }
      toast.success(t("fileRemoved"));
    },
    [urls, maxFiles, onChange, t],
  );

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      if (e.dataTransfer.files?.[0] && !disabled) {
        void runUpload(e.dataTransfer.files);
      }
    },
    [runUpload, disabled],
  );

  const openFilePicker = (replace = false) => {
    if (disabled || uploading) return;
    const canAdd = urls.length < maxFiles;
    if (!replace && !canAdd) return;
    replacingRef.current = replace;
    const input = inputRef.current;
    if (!input) return;
    input.value = "";
    input.click();
  };

  const getFileName = (url: string) => {
    try {
      const decoded = decodeURIComponent(url);
      const parts = decoded.split("/");
      const lastPart = parts[parts.length - 1];
      return lastPart.split("?")[0] || t("defaultFileName");
    } catch {
      return t("defaultFileName");
    }
  };

  const isImage = (url: string) => {
    const ext = url.split(".").pop()?.split("?")[0]?.toLowerCase() || "";
    return ["jpg", "jpeg", "png", "webp", "gif", "svg"].includes(ext);
  };

  /** Keep drop zone visible until maxFiles is reached (do not hide after first upload). */
  const showDropZone = urls.length < maxFiles;

  const uploadContent = (
    <div className={cn("w-full space-y-4", className)} dir={rtl.itemDir}>
      {/* Keep input mounted when drop zone is hidden so Replace can open the picker */}
      <input
        id={inputId}
        ref={inputRef}
        type="file"
        multiple={maxFiles > 1}
        accept={accept}
        onChange={(e) => void runUpload(e.target.files)}
        disabled={disabled || uploading}
        className="sr-only"
        aria-label={fileInputLabel}
        title={fileInputLabel}
      />

      {showDropZone && (
        <div
          className={cn(
            "relative border border-dashed rounded-lg p-6 text-center transition-all duration-200 bg-white",
            dragActive
              ? "border-[#2b2a6b] bg-[#eeeff8]/30 scale-[0.99]"
              : status === "failed"
                ? "border-destructive/50 bg-destructive/5"
                : "border-[#d6d6d6] hover:border-[#2b2a6b]/50",
            disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
            uploading && "pointer-events-none",
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => openFilePicker(false)}
        >
          <div className="flex flex-col items-center gap-3 w-full">
            {uploading ? (
              <Loader2 className="h-10 w-10 animate-spin text-[#2b2a6b]" />
            ) : (
              <div className="flex items-center justify-center shrink-0">
                <UploadIcon />
              </div>
            )}

            <p className="text-sm font-medium text-[#0b0b0b] m-0 w-full text-center">
              {uploading ? t("status.uploading") : t("dragAndDrop")}
            </p>

            <div className="flex items-center gap-3 w-48 max-w-full justify-center my-1 mx-auto">
              <div className="h-px bg-[#e7e7e7] grow" />
              <span className="text-xs text-[#6d6d6d] font-medium shrink-0">{t("or")}</span>
              <div className="h-px bg-[#e7e7e7] grow" />
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-[#2b2a6b] text-[#2b2a6b] hover:bg-[#eeeff8]/20 font-medium rounded-lg h-8"
              onClick={(e) => {
                e.stopPropagation();
                openFilePicker(false);
              }}
              disabled={disabled || uploading}
              aria-controls={inputId}
            >
              {t("browseFiles")}
            </Button>
          </div>
        </div>
      )}

      {status === "failed" && failedMessage && urls.length === 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 border border-destructive/40 rounded-lg bg-destructive/5">
          <p className={cn("text-sm text-destructive m-0 flex-1", rtl.message)}>{failedMessage}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0 gap-1.5"
            onClick={() => openFilePicker(false)}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            {t("retry")}
          </Button>
        </div>
      )}

      {urls.length > 0 && (
        <div className="space-y-2">
          {urls.map((url, index) => (
            <div
              key={`${url}-${index}`}
              className="flex items-center justify-between p-3 border border-[#019258]/40 rounded-lg bg-[#faf9fc] gap-3"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {isImage(url) ? (
                  <div className="h-10 w-10 rounded overflow-hidden border bg-white shrink-0">
                    <img src={url} alt={t("previewAlt")} className="h-full w-full object-cover" />
                  </div>
                ) : (
                  <div className="h-10 w-10 rounded bg-[#eeeff8] flex items-center justify-center text-[#2b2a6b] shrink-0 border">
                    <FileText className="h-5 w-5" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className={cn("text-sm font-medium text-[#232b32] truncate", rtl.message)}>{getFileName(url)}</p>
                  <p className="text-xs font-medium text-[#019258]">{t("status.uploaded")}</p>
                </div>
              </div>

              {!disabled && (
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-8 text-[#373787]"
                    onClick={(e) => {
                      e.stopPropagation();
                      openFilePicker(true);
                    }}
                  >
                    {t("replace")}
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove(index);
                    }}
                    className="h-8 w-8 text-[#5e7286] hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  if (formContext && name && !_isNested) {
    return (
      <FormField
        control={formContext.control}
        name={name}
        render={({ field }) => (
          <FormItem dir={rtl.itemDir} className="space-y-2 w-full">
            {label && !hideLabel && (
              <FormLabel className={cn(rtl.label, "text-sm text-[#090909]")}>
                <span className="min-w-0">{label}</span>
                {optional && (
                  <span className="font-normal text-[#758EA7]">&nbsp;(Optional)</span>
                )}
                {required && <span className={rtl.requiredMark}>*</span>}
              </FormLabel>
            )}
            <FormControl>
              <ImageUpload
                {...field}
                value={field.value}
                onChange={(val) => {
                  field.onChange(val);
                  onChange?.(val);
                }}
                label={label}
                maxFiles={maxFiles}
                disabled={disabled}
                accept={accept}
                hideLabel
                _isNested
              />
            </FormControl>
            <FormMessage className={rtl.message} />
          </FormItem>
        )}
      />
    );
  }

  return uploadContent;
}
