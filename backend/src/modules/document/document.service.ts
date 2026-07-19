import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { CreateDocumentDto } from './dto/create-document.dto';

@Injectable()
export class DocumentService {
  constructor(private readonly db: DatabaseService) {}

  async create(companyId: string, employeeId: string, dto: CreateDocumentDto) {
    await this.assertEmployeeInCompany(companyId, employeeId);
    return this.db.document.create({
      data: {
        employeeId,
        type: dto.type,
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : undefined,
        fileUrl: dto.fileUrl,
        documentNumber: dto.documentNumber,
      },
    });
  }

  async findAllForEmployee(companyId: string, employeeId: string) {
    await this.assertEmployeeInCompany(companyId, employeeId);
    return this.db.document.findMany({
      where: { employeeId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Documents (across the tenant) expiring within `days` days. */
  findExpiring(companyId: string, days: number) {
    const until = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    return this.db.document.findMany({
      where: {
        employee: { companyId },
        expiryDate: { not: null, lte: until },
      },
      orderBy: { expiryDate: 'asc' },
      include: { employee: { select: { id: true, name: true } } },
    });
  }

  async remove(companyId: string, id: string) {
    // Scope by the parent employee's company (tenant isolation).
    const doc = await this.db.document.findFirst({
      where: { id, employee: { companyId } },
      select: { id: true },
    });
    if (!doc) {
      throw new NotFoundException('Document not found');
    }
    await this.db.document.delete({ where: { id } });
    return { success: true };
  }

  private async assertEmployeeInCompany(companyId: string, employeeId: string) {
    const employee = await this.db.employee.findFirst({
      where: { id: employeeId, companyId },
      select: { id: true },
    });
    if (!employee) {
      throw new NotFoundException('Employee not found');
    }
  }
}
