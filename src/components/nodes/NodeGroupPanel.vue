<script setup>
import { ref, computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useNodeGroupStore } from '../../stores/nodeGroups';
import { useDataStore } from '../../stores/useDataStore';
import { useToastStore } from '../../stores/toast';
import NodeGroupModal from '../modals/NodeGroupModal.vue';

const nodeGroupStore = useNodeGroupStore();
const dataStore = useDataStore();
const { showToast } = useToastStore();

const { items: nodeGroups, isLoading } = storeToRefs(nodeGroupStore);
const { subscriptions } = storeToRefs(dataStore);

// 获取所有手动节点(非订阅)
const manualNodes = computed(() => {
  return subscriptions.value.filter(item => !item.url || !item.url.startsWith('http'));
});

// 模态框状态
const showModal = ref(false);
const editingGroup = ref(null);
const isNewGroup = ref(true);

// 搜索
const searchTerm = ref('');
const filteredGroups = computed(() => {
  if (!searchTerm.value) return nodeGroups.value;
  const query = searchTerm.value.toLowerCase();
  return nodeGroups.value.filter(g => 
    g.name.toLowerCase().includes(query) || 
    (g.description && g.description.toLowerCase().includes(query))
  );
});

// 打开新建分组模态框
const handleAdd = () => {
  isNewGroup.value = true;
  editingGroup.value = {
    name: '',
    description: '',
    nodeIds: [],
    enabled: true
  };
  showModal.value = true;
};

// 打开编辑分组模态框
const handleEdit = (group) => {
  isNewGroup.value = false;
  editingGroup.value = JSON.parse(JSON.stringify(group));
  showModal.value = true;
};

// 保存分组
const handleSave = async (group) => {
  try {
    await nodeGroupStore.saveGroup(group);
    showToast(isNewGroup.value ? '分组创建成功' : '分组已更新', 'success');
    showModal.value = false;
  } catch (error) {
    showToast(error.message || '保存分组失败', 'error');
  }
};

// 删除分组
const handleDelete = async (group) => {
  if (!confirm(`确定要删除分组 "${group.name}" 吗?\n节点本身不会被删除。`)) {
    return;
  }
  
  try {
    await nodeGroupStore.deleteGroup(group.id);
    showToast('分组已删除', 'success');
  } catch (error) {
    showToast(error.message || '删除分组失败', 'error');
  }
};

// 查看分组节点(跳转到手动节点页面并筛选)
const handleViewNodes = (group) => {
  // 这里可以通过路由参数或事件通知手动节点页面进行筛选
  // 暂时使用简单的提示
  showToast(`查看分组 "${group.name}" 的节点`, 'info');
};

// 获取分组的节点数量
const getNodeCount = (group) => {
  return group.nodeIds ? group.nodeIds.length : 0;
};

// 格式化更新时间
const formatTime = (timestamp) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  return date.toLocaleDateString('zh-CN');
};
</script>

<template>
  <div>
    <!-- 顶部操作栏 -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-4">
      <div class="flex items-center gap-3">
        <h2 class="text-xl font-bold text-gray-900 dark:text-white">节点分组</h2>
        <span class="px-2.5 py-0.5 text-sm font-semibold text-gray-700 dark:text-gray-200 bg-gray-200 dark:bg-gray-700/50 rounded-full">
          {{ nodeGroups.length }}
        </span>
      </div>
      <div class="flex items-center gap-2 w-full sm:w-auto">
        <div class="relative grow">
          <input 
            type="text" 
            v-model="searchTerm"
            placeholder="搜索分组..."
            class="w-full pl-9 pr-3 py-1.5 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-xs focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
          />
          <svg class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <button 
          @click="handleAdd" 
          class="text-sm font-semibold px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-xs shrink-0"
        >
          新建分组
        </button>
      </div>
    </div>

    <!-- 分组列表 -->
    <div v-if="filteredGroups.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div 
        v-for="group in filteredGroups" 
        :key="group.id"
        class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-700"
      >
        <!-- 分组头部 -->
        <div class="flex items-start justify-between mb-3">
          <div class="flex-1 min-w-0">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white truncate">
              🏷️ {{ group.name }}
            </h3>
            <p v-if="group.description" class="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
              {{ group.description }}
            </p>
          </div>
          <div class="flex items-center gap-1 ml-2">
            <button 
              @click="handleEdit(group)"
              class="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
              title="编辑"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
            </button>
            <button 
              @click="handleDelete(group)"
              class="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors"
              title="删除"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
              </svg>
            </button>
          </div>
        </div>

        <!-- 分组信息 -->
        <div class="space-y-2 mb-3">
          <div class="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
            </svg>
            <span class="font-medium">{{ getNodeCount(group) }}</span>
            <span class="ml-1">个节点</span>
          </div>
          <div class="flex items-center text-xs text-gray-500 dark:text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd" />
            </svg>
            更新于 {{ formatTime(group.updatedAt) }}
          </div>
        </div>

        <!-- 操作按钮 -->
        <button 
          @click="handleViewNodes(group)"
          class="w-full py-2 px-3 text-sm font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
        >
          查看节点
        </button>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else-if="!isLoading && nodeGroups.length === 0" class="text-center py-16">
      <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      </div>
      <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-1">还没有节点分组</h3>
      <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">创建分组来更好地管理您的节点</p>
      <button 
        @click="handleAdd"
        class="inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
      >
        创建第一个分组
      </button>
    </div>

    <!-- 搜索无结果 -->
    <div v-else-if="!isLoading && searchTerm && filteredGroups.length === 0" class="text-center py-12">
      <p class="text-gray-500 dark:text-gray-400">没有找到包含 "{{ searchTerm }}" 的分组</p>
    </div>

    <!-- 加载状态 -->
    <div v-if="isLoading" class="text-center py-12">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      <p class="mt-2 text-sm text-gray-500">加载中...</p>
    </div>

    <!-- 分组编辑模态框 -->
    <NodeGroupModal
      :show="showModal"
      :group="editingGroup"
      :is-new="isNewGroup"
      :all-manual-nodes="manualNodes"
      @update:show="showModal = $event"
      @save="handleSave"
    />
  </div>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
