<template>
  <Modal v-model="visible" :title="modalTitle" @close="handleClose">
    <div class="checkin-form">
      <div class="form-group">
        <label>打卡内容</label>
        <textarea
          v-model="content"
          placeholder="记录今天的完成情况、心得体会..."
          rows="4"
        ></textarea>
      </div>

      <div class="form-group">
        <label>添加图片</label>
        <div class="image-upload">
          <label class="upload-btn" v-if="images.length < 9">
            <input
              type="file"
              accept="image/*"
              multiple
              @change="handleImageSelect"
              hidden
            />
            <span>+</span>
            添加图片
          </label>
          <div v-for="(img, index) in images" :key="index" class="uploaded-image-wrapper">
            <img :src="img" alt="" class="uploaded-image" />
            <button class="remove-btn" @click="removeImage(index)">×</button>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <button class="btn btn-secondary" @click="handleClose">取消</button>
      <button class="btn btn-primary" @click="handleSubmit" :disabled="submitting">
        {{ submitting ? '打卡中...' : '确认打卡' }}
      </button>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import Modal from '@/components/common/Modal.vue'
import { processImage, validateImage } from '@/utils/image'
import { formatTimestamp } from '@/utils'
import type { Calendar, CheckInRecord } from '@/types'

interface Props {
  modelValue: boolean
  calendar: Calendar | null
  date: string
  existingRecord?: CheckInRecord | null
}

const props = withDefaults(defineProps<Props>(), {
  existingRecord: null
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'submit', data: { content: string; images: string[] }): void
}>()

const content = ref('')
const images = ref<string[]>([])
const submitting = ref(false)

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const modalTitle = computed(() => {
  if (!props.calendar) return '打卡'
  const dateStr = props.date
  const date = new Date(dateStr)
  const month = date.getMonth() + 1
  const day = date.getDate()
  return `${props.calendar.icon} ${props.calendar.name} · ${month}月${day}日`
})

// 初始化表单数据
watch(() => props.modelValue, (val) => {
  if (val) {
    if (props.existingRecord) {
      content.value = props.existingRecord.content
      images.value = [...props.existingRecord.images]
    } else {
      content.value = ''
      images.value = []
    }
  }
})

async function handleImageSelect(e: Event) {
  const input = e.target as HTMLInputElement
  const files = input.files
  if (!files) return

  for (const file of Array.from(files)) {
    const validation = validateImage(file)
    if (!validation.valid) {
      alert(validation.error)
      continue
    }

    try {
      const base64 = await processImage(file)
      if (images.value.length < 9) {
        images.value.push(base64)
      }
    } catch (err) {
      console.error('图片处理失败:', err)
      alert('图片处理失败')
    }
  }

  // 清空 input 以便重复选择同一文件
  input.value = ''
}

function removeImage(index: number) {
  images.value.splice(index, 1)
}

function handleClose() {
  visible.value = false
}

async function handleSubmit() {
  if (!props.calendar) return

  submitting.value = true
  try {
    emit('submit', {
      content: content.value.trim(),
      images: images.value
    })
    handleClose()
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.checkin-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.form-group textarea {
  width: 100%;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 12px;
  font-size: 14px;
  resize: none;
  font-family: inherit;
  transition: border-color 0.2s;
}

.form-group textarea:focus {
  outline: none;
  border-color: #333;
}

.image-upload {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.upload-btn {
  width: 80px;
  height: 80px;
  border: 2px dashed #ddd;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #999;
  font-size: 12px;
  gap: 4px;
  transition: all 0.2s;
}

.upload-btn:hover {
  border-color: #999;
  color: #666;
}

.upload-btn span {
  font-size: 24px;
}

.uploaded-image-wrapper {
  position: relative;
}

.uploaded-image {
  width: 80px;
  height: 80px;
  border-radius: 12px;
  object-fit: cover;
}

.remove-btn {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #ff4444;
  color: #fff;
  border: none;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn {
  padding: 10px 20px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-secondary {
  background: #f5f5f5;
  color: #666;
}

.btn-secondary:hover {
  background: #eee;
}

.btn-primary {
  background: #333;
  color: #fff;
}

.btn-primary:hover {
  background: #555;
}

.btn-primary:disabled {
  background: #999;
  cursor: not-allowed;
}
</style>
