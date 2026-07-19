export declare class RegisterDto {
    companyName: string;
    email: string;
    password: string;
    establishmentNumber?: string;
    planId?: string;
}
export declare class LoginDto {
    email: string;
    password: string;
}
export declare class ChangePasswordDto {
    currentPassword: string;
    newPassword: string;
}
