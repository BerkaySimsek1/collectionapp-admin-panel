declare module 'sweetalert2' {
  /**
   * SweetAlert2 basit tanım
   */
  interface SweetAlertResult {
    isConfirmed: boolean;
    isDenied: boolean;
    isDismissed: boolean;
    value: any;
  }

  interface SweetAlertOptions {
    title?: string;
    text?: string;
    icon?: 'warning' | 'error' | 'success' | 'info' | 'question';
    showCancelButton?: boolean;
    confirmButtonText?: string;
    cancelButtonText?: string;
    confirmButtonColor?: string;
    cancelButtonColor?: string;
    [key: string]: any;
  }

  interface SweetAlert {
    fire(options: SweetAlertOptions): Promise<SweetAlertResult>;
    fire(title: string, text?: string, icon?: string): Promise<SweetAlertResult>;
  }

  const swal: SweetAlert;
  export default swal;
} 