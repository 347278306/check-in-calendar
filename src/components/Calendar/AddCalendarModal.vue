<template>
  <Modal v-model="visible" :title="isEdit ? '编辑日历' : '新建打卡日历'" @close="handleClose">
    <div class="add-calendar-form">
      <div class="form-group">
        <label>日历名称</label>
        <input
          v-model="form.name"
          type="text"
          placeholder="如：每日读书、健身打卡"
          maxlength="20"
        />
      </div>

      <div class="form-group">
        <label>选择图标</label>
        <div class="icon-options">
          <div
            v-for="icon in ICON_OPTIONS"
            :key="icon"
            class="icon-option"
            :class="{ selected: form.icon === icon }"
            @click="form.icon = icon"
          >
            {{ icon }}
          </div>
        </div>
      </div>

      <div class="form-group">
        <label>选择颜色</label>
        <div class="color-options">
          <div
            v-for="color in COLOR_OPTIONS"
            :key="color"
            class="color-option"
            :class="{ selected: form.color === color }"
            :style="{ background: color }"
            @click="form.color = color"
          ></div>
        </div>
      </div>

      <div class="form-group">
        <label>习惯说明（可选）</label>
        <textarea
          v-model="form.description"
          placeholder="描述你的习惯目标，如：每天阅读至少30分钟"
          rows="2"
        ></textarea>
      </div>
    </div>

    <template #footer>
      <button v-if="isEdit" class="btn btn-danger" @click="handleDelete">删除日历</button>
      <div class="footer-right">
        <button class="btn btn-secondary" @click="handleClose">取消</button>
        <button class="btn btn-primary" @click="handleSubmit" :disabled="submitting || !form.name.trim()">
          {{ submitting ? '保存中...' : (isEdit ? '保存' : '创建日历') }}
        </button>
      </div>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch } from 'vue'
import Modal from '@/components/common/Modal.vue'
import { ICON_OPTIONS, COLOR_OPTIONS } from '@/types'
import type { Calendar } from '@/types'

interface Props {
  modelValue: boolean
  calendar?: Calendar | null
}

const props = withDefaults(defineProps<Props>(), {
  calendar: null
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'submit', data: { name: string; icon: string; color: string; description: string }): void
  (e: 'delete'): void
}>()

const submitting = ref(false)

const form = reactive({
  name: '',
  icon: '📚',
  color: COLOR_OPTIONS[0],
  description: ''
})

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const isEdit = computed(() => !!props.calendar)

// 初始化表单数据
watch(() => props.modelValue, (val) => {
  if (val) {
    if (props.calendar) {
      form.name = props.calendar.name
      form.icon = props.calendar.icon
      form.color = props.calendar.color
      form.description = props.calendar.description || ''
    } else {
      form.name = ''
      form.icon = ICON_OPTIONS[0]
      form.color = COLOR_OPTIONS[0]
      form.description = ''
    }
  }
})

function handleClose() {
  visible.value = false
}

async function handleSubmit() {
  if (!form.name.trim()) return

  submitting.value = true
  try {
    emit('submit', {
      name: form.name.trim(),
      icon: form.icon,
      color: form.color,
      description: form.description.trim()
    })
    handleClose()
  } finally {
    submitting.value = false
  }
}

function handleDelete() {
  if (confirm('确定要删除这个日历吗？相关的打卡记录也会被删除。')) {
    emit('delete')
    handleClose()
  }
}
</script>

<style scoped>
.add-calendar-form {
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

.form-group input,
.form-group textarea {
  width: 100%;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 12px;
  font-size: 14px;
  font-family: inherit;
  transition: border-color 0.2s;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #333;
}

.form-group textarea {
  resize: none;
}

.icon-options {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 12px;
}

.icon-option {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  cursor: pointer;
  border: 2px solid #f0f0f0;
  transition: all 0.2s;
}

.icon-option:hover {
  border-color: #ccc;
}

.icon-option.selected {
  border-color: #333;
  background: #f5f5f0;
}

.color-options {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.color-option {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  cursor: pointer;
  border: 3px solid transparent;
  transition: all 0.2s;
}

.color-option:hover {
  transform: scale(1.1);
}

.color-option.selected {
  border-color: #333;
  transform: scale(1.1);
}

.footer-right {
  display: flex;
  gap: 12px;
  margin-left: auto;
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

.btn-danger {
  background: #ff4444;
  color: #fff;
}

.btn-danger:hover {
  background: #ff2222;
}
</style>
