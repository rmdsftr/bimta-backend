import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class ValidateIdPipe implements PipeTransform {
    transform(value: string): string {
        if (!value || typeof value !== 'string' || !value.trim()) {
            throw new BadRequestException('ID tidak valid');
        }
        return value.trim();
    }
}