<script setup lang="ts">
withDefaults(
  defineProps<{
    currentPage: number;
    pageSize: number;
    total: number;
    pageSizes?: number[];
  }>(),
  {
    pageSizes: () => [10, 20, 50, 100, 500, 1000]
  }
);

const emit = defineEmits<{
  (event: "update:currentPage", value: number): void;
  (event: "update:pageSize", value: number): void;
}>();
</script>

<template>
  <div class="mt-4 flex justify-end">
    <el-pagination
      :current-page="currentPage"
      :page-size="pageSize"
      background
      layout="total, sizes, prev, pager, next, jumper"
      :page-sizes="pageSizes"
      :total="total"
      @update:current-page="emit('update:currentPage', $event)"
      @update:page-size="emit('update:pageSize', $event)"
    />
  </div>
</template>
