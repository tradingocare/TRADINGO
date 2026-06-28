import api from '../api/client'

export async function uploadFile(
  file: File,
  folder: string,
  onProgress?: (pct: number) => void,
): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('folder', folder)

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', '/api/v1/upload')

    const token = localStorage.getItem('accessToken')
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`)

    xhr.upload.onprogress = e => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100))
      }
    }

    xhr.onload = () => {
      if (xhr.status === 200) {
        const res = JSON.parse(xhr.responseText)
        resolve(res.url)
      } else {
        reject(new Error('Upload failed'))
      }
    }
    xhr.onerror = () => reject(new Error('Network error'))
    xhr.send(formData)
  })
}

export async function uploadMultiple(
  files: File[],
  folder: string,
  onProgress?: (pct: number) => void,
): Promise<string[]> {
  const urls: string[] = []
  for (let i = 0; i < files.length; i++) {
    const url = await uploadFile(files[i], folder, pct => {
      if (onProgress) onProgress(Math.round(((i + pct / 100) / files.length) * 100))
    })
    urls.push(url)
  }
  return urls
}
