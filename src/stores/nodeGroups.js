import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

/**
 * 节点分组 Store
 * 管理节点分组的状态和操作
 */
export const useNodeGroupStore = defineStore('nodeGroups', () => {
    // 状态
    const items = ref([]);
    const isLoading = ref(false);

    // 计算属性
    const activeItems = computed(() => items.value.filter(g => g.enabled !== false));

    // 根据ID获取分组
    const getGroupById = (id) => items.value.find(g => g.id === id);

    // 获取包含指定节点的所有分组
    const getGroupsByNodeId = (nodeId) => {
        return items.value.filter(g => g.nodeIds && g.nodeIds.includes(nodeId));
    };

    // Actions

    /**
     * 设置分组列表
     */
    function setItems(newItems) {
        items.value = newItems || [];
    }

    /**
     * 添加分组
     */
    function add(group) {
        items.value.push(group);
    }

    /**
     * 更新分组
     */
    function update(id, updates) {
        const index = items.value.findIndex(g => g.id === id);
        if (index !== -1) {
            items.value[index] = { ...items.value[index], ...updates };
        }
    }

    /**
     * 删除分组
     */
    function remove(id) {
        const index = items.value.findIndex(g => g.id === id);
        if (index !== -1) {
            items.value.splice(index, 1);
        }
    }

    /**
     * 从API获取分组列表
     */
    async function fetchGroups() {
        isLoading.value = true;
        try {
            const response = await fetch('/api/node-groups');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            const result = await response.json();
            if (result.success) {
                setItems(result.data);
            } else {
                throw new Error(result.message || '获取分组失败');
            }
        } catch (error) {
            console.error('Failed to fetch node groups:', error);
            throw error;
        } finally {
            isLoading.value = false;
        }
    }

    /**
     * 保存分组(创建或更新)
     */
    async function saveGroup(group) {
        try {
            const response = await fetch('/api/node-groups', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(group)
            });

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            const result = await response.json();
            if (result.success) {
                setItems(result.data);
                return result;
            } else {
                throw new Error(result.message || '保存分组失败');
            }
        } catch (error) {
            console.error('Failed to save node group:', error);
            throw error;
        }
    }

    /**
     * 删除分组
     */
    async function deleteGroup(id) {
        try {
            const response = await fetch(`/api/node-groups?id=${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            const result = await response.json();
            if (result.success) {
                setItems(result.data);
                return result;
            } else {
                throw new Error(result.message || '删除分组失败');
            }
        } catch (error) {
            console.error('Failed to delete node group:', error);
            throw error;
        }
    }

    return {
        // State
        items,
        isLoading,

        // Getters
        activeItems,
        getGroupById,
        getGroupsByNodeId,

        // Actions
        setItems,
        add,
        update,
        remove,
        fetchGroups,
        saveGroup,
        deleteGroup
    };
});
