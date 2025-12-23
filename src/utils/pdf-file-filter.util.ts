import { BadRequestException } from '@nestjs/common';

export const pdfFileFilter = (
  req: any,
  file: Express.Multer.File,
  callback: (error: Error | null, acceptFile: boolean) => void,
) => {
  if (file.mimetype !== 'application/pdf') {
    callback(new BadRequestException('Only PDF files are allowed!'), false);
  } else {
    callback(null, true);
  }
};