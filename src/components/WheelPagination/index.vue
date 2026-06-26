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
  (event: "change"): void;
}>();

function onCurrentPageChange(value: number): void {
  emit("update:currentPage", value);
  emit("change");
}

function onPageSizeChange(value: number): void {
  emit("update:pageSize", value);
  emit("change");
}
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
      @update:current-page="onCurrentPageChange"
      @update:page-size="onPageSizeChange"
    />
  </div>
</template>
