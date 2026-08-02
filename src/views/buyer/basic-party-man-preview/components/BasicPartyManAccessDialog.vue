<script setup lang="ts">
defineProps<{
  themeColor: string;
}>();

const visible = defineModel<boolean>({ required: true });

const emit = defineEmits<{
  unlock: [];
}>();
</script>

<template>
  <el-dialog
    v-model="visible"
    class="party-access-dialog"
    :style="{ '--party-theme': themeColor }"
    width="min(370px, calc(100vw - 30px))"
    append-to-body
    align-center
    :show-close="false"
  >
    <button class="dialog-close" type="button" @click="visible = false">
      ×
    </button>
    <div class="whatsapp-mark">◔</div>
    <h2>WhatsApp 必须</h2>
    <p>请先绑定您的 WhatsApp 以解锁应用访问权限</p>
    <el-button class="access-submit" @click="emit('unlock')">
      ◫ 立即解锁
    </el-button>
  </el-dialog>
</template>

<style scoped>
.dialog-close {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 34px;
  height: 34px;
  color: rgb(255 255 255 / 68%);
  cursor: pointer;
  background: rgb(255 255 255 / 8%);
  border: 0;
  border-radius: 50%;
}

.whatsapp-mark {
  display: grid;
  place-items: center;
  width: 58px;
  height: 58px;
  margin: 4px auto 18px;
  font-size: 30px;
  color: var(--party-theme);
  background: color-mix(in srgb, var(--party-theme) 18%, #25101a);
  border: 1px solid color-mix(in srgb, var(--party-theme) 48%, transparent);
  border-radius: 50%;
}

h2 {
  margin: 0 0 8px;
  color: #fff;
  text-align: center;
}

p {
  margin: 0 0 22px;
  font-size: 13px;
  color: rgb(255 255 255 / 58%);
  text-align: center;
}

.access-submit {
  width: 100%;
  min-height: 50px;
  font-weight: 800;
  color: #fff;
  background: var(--party-theme);
  border: 0;
  border-radius: 12px;
  box-shadow: 0 10px 30px
    color-mix(in srgb, var(--party-theme) 35%, transparent);
}

:global(.party-access-dialog) {
  overflow: hidden;
  background: linear-gradient(145deg, #27121d, #130910);
  border: 1px solid color-mix(in srgb, var(--party-theme) 42%, transparent);
  border-radius: 22px;
}

:global(.party-access-dialog .el-dialog__header) {
  display: none;
}
</style>
