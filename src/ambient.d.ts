declare module 'next/server' {
  export type NextRequest = any;

  export class NextResponse {
    constructor(body?: any, init?: any);
    static json(body: any, init?: any): any;
    static redirect(url: any, init?: any): any;
  }
}

