// src/api/upload.js
import request from '../utils/request';

/**
 * 上传图片文件
 * @param {File} file - 图片文件对象
 * @returns {Promise<Object>}
 */
export const uploadImage = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  // 根据 API 设计，可能还需要一个 type 字段
  formData.append('type', 'item'); 

  return request({
    url: '/upload/image',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};