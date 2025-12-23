export const imageFileFilter = (
  req: any,
  file: Express.Multer.File,
  callback: (error: Error | null, acceptFile: boolean) => void,
) => {
  if (!file.mimetype.startsWith('image/')) {
    callback(new Error('Only image files are allowed!'), false);
  } else {
    callback(null, true);
  }
};