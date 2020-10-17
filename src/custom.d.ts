// Required for tsc to compile with imported svg files
declare module "*.svg" {
    const content: any;
    export default content;
}

// So Typescript knows how to deal with img imports
declare module "*.jpg";
declare module "*.jpeg";
declare module "*.png";
declare module "*.bmp";
declare module "*.gif";