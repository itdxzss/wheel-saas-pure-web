<script setup lang="ts">
defineProps<{ modelValue: boolean }>();
defineEmits<{ (event: "update:modelValue", value: boolean): void }>();
</script>

<template>
  <el-dialog
    :model-value="modelValue"
    title="Facebook事件配置指引"
    width="640px"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <el-steps direction="vertical" :active="4" finish-status="success">
      <el-step
        title="创建 Pixel"
        description="在 Meta Events Manager 中创建数据源并复制 Pixel ID。"
      />
      <el-step
        title="生成令牌"
        description="生成 Conversions API Access Token；系统仅支持写入，不会回显。"
      />
      <el-step
        title="配置事件"
        description="按需映射 Lead、InitiateCheckout、CompleteRegistration。"
      />
      <el-step
        title="检测渠道"
        description="保存后执行检测，确认域名及事件发布状态。"
      />
    </el-steps>
  </el-dialog>
</template>
