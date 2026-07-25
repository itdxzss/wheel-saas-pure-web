<script setup lang="ts">
import {
  ArrowLeft,
  Clock,
  Connection,
  EditPen,
  SwitchButton
} from "@element-plus/icons-vue";

const logoutConfirmVisible = defineModel<boolean>("logoutConfirmVisible", {
  required: true
});

const emit = defineEmits<{
  back: [];
  confirmLogout: [];
}>();

function confirmLogout(): void {
  logoutConfirmVisible.value = false;
  emit("confirmLogout");
}
</script>

<template>
  <section class="device-detail-page">
    <header class="detail-header">
      <el-button text aria-label="返回设备列表" @click="emit('back')">
        <el-icon><ArrowLeft /></el-icon>
      </el-button>
      <strong>编辑装置</strong>
      <el-button text aria-label="编辑设备名称">
        <el-icon><EditPen /></el-icon>
      </el-button>
    </header>

    <div class="device-identity">
      <span class="opera-logo" aria-hidden="true">O</span>
      <h1>Opera (iOS)</h1>
      <p>设备名称</p>
    </div>

    <dl class="device-facts">
      <div>
        <dt>
          <el-icon><Clock /></el-icon>
        </dt>
        <dd>今天最后一次活跃于 3:48 PM</dd>
      </div>
      <div>
        <dt>
          <el-icon><Connection /></el-icon>
        </dt>
        <dd>Opera (iOS)</dd>
      </div>
    </dl>

    <el-button class="logout-button" @click="logoutConfirmVisible = true">
      <el-icon><SwitchButton /></el-icon>
      登出
    </el-button>
    <p class="logout-hint">如果你不认识这个设备或无法访问它，应该登出它。</p>

    <el-dialog
      v-model="logoutConfirmVisible"
      class="basic-earn-logout-dialog"
      width="min(360px, calc(100vw - 32px))"
      append-to-body
      align-center
      :show-close="false"
      :close-on-click-modal="false"
    >
      <div class="logout-confirmation">
        <h2>登出？</h2>
        <p>该设备将被 WhatsApp 登出。</p>
        <div class="confirmation-actions">
          <el-button text @click="logoutConfirmVisible = false">取消</el-button>
          <el-button text @click="confirmLogout">登出</el-button>
        </div>
      </div>
    </el-dialog>
  </section>
</template>

<style scoped>
.device-detail-page {
  min-height: 100vh;
  color: #273238;
  background: #fff;
}

.detail-header {
  display: grid;
  grid-template-columns: 48px 1fr 48px;
  align-items: center;
  min-height: 66px;
  padding: 0 10px;
  border-bottom: 1px solid #eef1f2;
}

.detail-header strong {
  font-size: 20px;
}

.detail-header .el-button:last-child {
  justify-self: end;
}

.detail-header .el-icon {
  font-size: 22px;
}

.device-identity {
  display: grid;
  place-items: center;
  padding: 46px 18px 30px;
  text-align: center;
}

.opera-logo {
  font-family: Georgia, serif;
  font-size: 88px;
  font-weight: 700;
  line-height: 1;
  color: #df2634;
}

.device-identity h1 {
  margin: 16px 0 4px;
  font-size: 23px;
}

.device-identity p {
  margin: 0;
  color: #75838a;
}

.device-facts {
  padding: 0 20px;
  margin: 0;
}

.device-facts > div {
  display: grid;
  grid-template-columns: 28px 1fr;
  align-items: center;
  min-height: 54px;
}

.device-facts dt {
  color: #718087;
}

.device-facts dd {
  margin: 0;
}

.logout-button {
  width: calc(100% - 36px);
  min-height: 52px;
  margin: 26px 18px 0;
  font-size: 16px;
  font-weight: 800;
  color: #f12254;
  background: #fff;
  border-color: #d9dfe2;
  border-radius: 999px;
}

.logout-hint {
  padding: 0 20px;
  margin: 16px 0;
  font-size: 13px;
  color: #77858b;
}

.logout-confirmation {
  padding: 4px 2px 0;
  color: #243138;
}

.logout-confirmation h2 {
  margin: 0 0 17px;
  font-size: 22px;
}

.logout-confirmation p {
  margin: 0 0 28px;
  color: #6e7b82;
}

.confirmation-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.confirmation-actions .el-button {
  font-weight: 800;
  color: #008b71;
}

:global(.basic-earn-logout-dialog) {
  padding: 24px;
  border-radius: 24px;
  box-shadow: 0 22px 65px rgb(0 0 0 / 24%);
}

:global(.basic-earn-logout-dialog .el-dialog__header) {
  display: none;
}
</style>
