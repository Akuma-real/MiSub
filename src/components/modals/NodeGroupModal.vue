<script setup>
import { ref, watch, computed } from 'vue';
import Modal from '../forms/Modal.vue';

const props = defineProps({
  show: Boolean,
  group: Object,
  isNew: Boolean,
  allManualNodes: Array,
});

const emit = defineEmits(['update:show', 'save']);

const localGroup = ref({});
const nodeSearchTerm = ref('');

// 过滤节点列表
const filteredNodes = computed(() => {
  if (!nodeSearchTerm.value) return props.allManualNodes;
  
  const query = nodeSearchTerm.value.toLowerCase();
  return props.allManualNodes.filter(node => 
    node.name && node.name.toLowerCase().includes(query)
  );
});

// 已选节点数量
const selectedCount = computed(() => {
  return localGroup.value.nodeIds ? localGroup.value.nodeIds.length : 0;
});

// 监听props变化,更新本地状态
watch(() => props.group, (newGroup) => {
  if (newGroup) {
    localGroup.value = JSON.parse(JSON.stringify(newGroup));
    if (!localGroup.value.nodeIds) {
      localGroup.value.nodeIds = [];
    }
  } else {
    localGroup.value = {
      name: '',
      description: '',
      nodeIds: [],
      enabled: true
    };
  }
}, { deep: true, immediate: true });

// 切换节点选择
const toggleNode = (nodeId) => {
  const index = localGroup.value.nodeIds.indexOf(nodeId);
  if (index > -1) {
    localGroup.value.nodeIds.splice(index, 1);
  } else {
    localGroup.value.nodeIds.push(nodeId);
  }
};

// 全选
const handleSelectAll = () => {
  const allIds = filteredNodes.value.map(n => n.id);
  const currentIds = new Set(localGroup.value.nodeIds);
  allIds.forEach(id => currentIds.add(id));
  localGroup.value.nodeIds = Array.from(currentIds);
};

// 全不选
const handleDeselectAll = () => {
  const filteredIds = new Set(filteredNodes.value.map(n => n.id));
  localGroup.value.nodeIds = localGroup.value.nodeIds.filter(id => !filteredIds.has(id));
};

// 确认保存
const handleConfirm = () => {
  // 验证
  if (!localGroup.value.name || !localGroup.value.name.trim()) {
    alert('请输入分组名称');
    return;
  }
  
  if (!localGroup.value.nodeIds || localGroup.value.nodeIds.length === 0) {
    alert('请至少选择一个节点');
    return;
  }
  
  emit('save', localGroup.value);
};
</script>

<template>
  <Modal 
    :show="show" 
    @update:show="emit('update:show', $event)" 
    @confirm="handleConfirm"
    size="lg"
  >
    <template #title>
      <h3 class="text-lg font-bold text-gray-800 dark:text-white">
        {{ isNew ? '新建节点分组' : '编辑节点分组' }}
      </h3>
    </template>
    
    <template #body>
      <div v-if="localGroup" class="space-y-4">
        <!-- 分组名称 -->
        <div>
          <label for="group-name" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            分组名称 <span class="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="group-name"
            v-model="localGroup.name"
            placeholder="例如:香港节点"
            maxlength="30"
            class="block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-xs focus:outline-hidden focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:text-white"
          />
        </div>

        <!-- 分组描述 -->
        <div>
          <label for="group-description" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            分组描述 (可选)
          </label>
          <textarea
            id="group-description"
            v-model="localGroup.description"
            placeholder="例如:所有香港地区的高速节点"
            rows="2"
            maxlength="100"
            class="block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-xs focus:outline-hidden focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:text-white resize-none"
          ></textarea>
        </div>

        <!-- 选择节点 -->
        <div>
          <div class="flex justify-between items-center mb-2">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
              选择节点 <span class="text-red-500">*</span>
            </label>
            <div class="space-x-2">
              <button 
                @click="handleSelectAll" 
                type="button"
                class="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                全选
              </button>
              <button 
                @click="handleDeselectAll" 
                type="button"
                class="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                全不选
              </button>
            </div>
          </div>

          <!-- 搜索框 -->
          <div class="relative mb-2">
            <input
              type="text"
              v-model="nodeSearchTerm"
              placeholder="搜索节点..."
              class="w-full pl-9 pr-3 py-1.5 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-xs focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <svg class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <!-- 节点列表 -->
          <div class="overflow-y-auto space-y-2 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border dark:border-gray-700 h-64">
            <div v-for="node in filteredNodes" :key="node.id">
              <label class="flex items-center space-x-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 rounded p-2 transition-colors">
                <input
                  type="checkbox"
                  :checked="localGroup.nodeIds?.includes(node.id)"
                  @change="toggleNode(node.id)"
                  class="h-4 w-4 rounded-sm border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span class="text-sm text-gray-800 dark:text-gray-200 truncate flex-1" :title="node.name">
                  {{ node.name || '未命名节点' }}
                </span>
              </label>
            </div>
            
            <div v-if="filteredNodes.length === 0" class="text-center text-gray-500 text-sm py-8">
              {{ nodeSearchTerm ? '没有找到匹配的节点' : '没有可用的手动节点' }}
            </div>
          </div>

          <!-- 已选计数 -->
          <div class="mt-2 text-sm text-gray-600 dark:text-gray-400">
            已选择: <span class="font-semibold text-indigo-600 dark:text-indigo-400">{{ selectedCount }}</span> 个节点
          </div>
        </div>
      </div>
    </template>
  </Modal>
</template>
