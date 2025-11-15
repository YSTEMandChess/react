

declare module '*.svg' {
  import * as React from 'react';
  const content: string;
  export default content;
  export const ReactComponent: React.FC<React.SVGProps<SVGSVGElement>>;
}
  
  declare module "*.png" {
    const content: string;
    export default content;
  }
  
  declare module "*.jpg" {
    const content: string;
    export default content;
  }
  
  declare module "*.jpeg" {
    const content: string;
    export default content;
  }
  
  declare module "*.gif" {
    const content: string;
    export default content;
  }
  
