'use client'

import Swal from 'sweetalert2'

/** ألوان من الثيم الموحد (CSS variables التي يحدّثها ThemeContext) */
function getThemeColors() {
  if (typeof document === 'undefined') {
    return { primary: '#D4AF37', error: '#ba1a1a', secondary: '#6b7280' }
  }
  const root = document.documentElement
  const get = (v: string, fallback: string) =>
    getComputedStyle(root).getPropertyValue(v).trim() || fallback
  return {
    primary: get('--primary-color', '#D4AF37'),
    error: get('--color-error', '#ba1a1a'),
    secondary: get('--color-outline-variant', '#6b7280'),
  }
}

export const showSuccess = (message: string) => {
  const colors = getThemeColors()
  return Swal.fire({
    icon: 'success',
    title: 'نجح!',
    text: message,
    confirmButtonText: 'حسناً',
    confirmButtonColor: colors.primary,
    customClass: {
      popup: 'rounded-3xl', // M3 rounded
      confirmButton: 'rounded-full', // M3 button
    },
  })
}

export const showError = (message: string) => {
  const colors = getThemeColors()
  return Swal.fire({
    icon: 'error',
    title: 'خطأ!',
    text: message,
    confirmButtonText: 'حسناً',
    confirmButtonColor: colors.error,
    customClass: {
      popup: 'rounded-3xl',
      confirmButton: 'rounded-full',
    },
  })
}

export const showConfirm = (message: string) => {
  const colors = getThemeColors()
  return Swal.fire({
    icon: 'question',
    title: 'تأكيد',
    text: message,
    showCancelButton: true,
    confirmButtonText: 'نعم',
    cancelButtonText: 'لا',
    confirmButtonColor: colors.primary,
    cancelButtonColor: colors.secondary,
    customClass: {
      popup: 'rounded-3xl',
      confirmButton: 'rounded-full',
      cancelButton: 'rounded-full',
    },
  })
}

export const showLoading = (message: string = 'جاري التحميل...') => {
  Swal.fire({
    title: message,
    allowOutsideClick: false,
    allowEscapeKey: false,
    customClass: {
      popup: 'rounded-3xl',
    },
    didOpen: () => {
      Swal.showLoading()
    },
  })
}

export const closeLoading = () => {
  Swal.close()
}
