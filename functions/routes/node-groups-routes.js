/**
 * 节点分组路由处理器
 * 处理节点分组的CRUD操作
 */

import { StorageFactory } from '../storage-adapter.js';
import { KV_KEY_NODE_GROUPS } from '../modules/config.js';
import { createJsonResponse } from '../modules/utils.js';

/**
 * 生成唯一ID
 */
function generateId() {
    return `group-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 处理节点分组请求
 * @param {Request} request - HTTP请求
 * @param {Object} env - Cloudflare环境对象
 * @returns {Promise<Response>} JSON响应
 */
export async function handleNodeGroupsRequest(request, env) {
    const method = request.method;
    const storageAdapter = StorageFactory.createAdapter(env, await StorageFactory.getStorageType(env));

    try {
        // GET - 获取所有分组
        if (method === 'GET') {
            const groups = await storageAdapter.get(KV_KEY_NODE_GROUPS) || [];
            return createJsonResponse({
                success: true,
                data: groups
            });
        }

        // POST - 创建或更新分组
        if (method === 'POST') {
            const body = await request.json();
            const groups = await storageAdapter.get(KV_KEY_NODE_GROUPS) || [];

            // 验证必填字段
            if (!body.name || !body.name.trim()) {
                return createJsonResponse({
                    success: false,
                    message: '分组名称不能为空'
                }, 400);
            }

            if (!body.nodeIds || !Array.isArray(body.nodeIds) || body.nodeIds.length === 0) {
                return createJsonResponse({
                    success: false,
                    message: '至少选择一个节点'
                }, 400);
            }

            const now = new Date().toISOString();

            if (body.id) {
                // 更新现有分组
                const index = groups.findIndex(g => g.id === body.id);
                if (index === -1) {
                    return createJsonResponse({
                        success: false,
                        message: '分组不存在'
                    }, 404);
                }

                // 检查名称是否与其他分组重复
                const duplicateName = groups.some((g, i) =>
                    i !== index && g.name.trim() === body.name.trim()
                );
                if (duplicateName) {
                    return createJsonResponse({
                        success: false,
                        message: '分组名称已存在'
                    }, 400);
                }

                groups[index] = {
                    ...groups[index],
                    name: body.name.trim(),
                    description: body.description?.trim() || '',
                    nodeIds: body.nodeIds,
                    enabled: body.enabled !== false,
                    updatedAt: now
                };
            } else {
                // 创建新分组
                // 检查名称是否重复
                const duplicateName = groups.some(g => g.name.trim() === body.name.trim());
                if (duplicateName) {
                    return createJsonResponse({
                        success: false,
                        message: '分组名称已存在'
                    }, 400);
                }

                const newGroup = {
                    id: generateId(),
                    name: body.name.trim(),
                    description: body.description?.trim() || '',
                    nodeIds: body.nodeIds,
                    enabled: body.enabled !== false,
                    createdAt: now,
                    updatedAt: now
                };
                groups.push(newGroup);
            }

            await storageAdapter.put(KV_KEY_NODE_GROUPS, groups);

            return createJsonResponse({
                success: true,
                message: body.id ? '分组已更新' : '分组创建成功',
                data: groups
            });
        }

        // DELETE - 删除分组
        if (method === 'DELETE') {
            const url = new URL(request.url);
            const groupId = url.searchParams.get('id');

            if (!groupId) {
                return createJsonResponse({
                    success: false,
                    message: '缺少分组ID'
                }, 400);
            }

            const groups = await storageAdapter.get(KV_KEY_NODE_GROUPS) || [];
            const index = groups.findIndex(g => g.id === groupId);

            if (index === -1) {
                return createJsonResponse({
                    success: false,
                    message: '分组不存在'
                }, 404);
            }

            groups.splice(index, 1);
            await storageAdapter.put(KV_KEY_NODE_GROUPS, groups);

            return createJsonResponse({
                success: true,
                message: '分组已删除',
                data: groups
            });
        }

        return createJsonResponse({
            success: false,
            message: '不支持的请求方法'
        }, 405);

    } catch (error) {
        console.error('[Node Groups API Error]', error);
        return createJsonResponse({
            success: false,
            message: `操作失败: ${error.message}`
        }, 500);
    }
}
