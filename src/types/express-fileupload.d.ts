declare module 'express-fileupload' {
  import { RequestHandler } from 'express';
  interface Options {
    limits?: Record<string, any>;
    abortOnLimit?: boolean;
    responseOnLimit?: string;
  }
  function fileUpload(options?: Options): RequestHandler;
  export = fileUpload;
}
