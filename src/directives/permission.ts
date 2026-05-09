import { DirectiveBinding } from 'vue'
import { useUserStore } from '@/store/modules/user'

/**
 * 按钮级权限指令
 * 语法: v-hasPermi="['sys:user:add']"
 */
export const hasPermi = {
  mounted(el: HTMLElement, binding: DirectiveBinding) {
    const { value } = binding
    const userStore = useUserStore()
    const all_permissions = "*:*:*" // 超级管理员权限标识
    const permissions = userStore.permissions

    if (value && value instanceof Array && value.length > 0) {
      const permissionFlag = value

      const hasPermissions = permissions.some(permission => {
        return all_permissions === permission || permissionFlag.includes(permission)
      })

      if (!hasPermissions) {
        el.parentNode && el.parentNode.removeChild(el)
      }
    } else {
      throw new Error(`请设置操作权限标签值, 如 v-hasPermi="['sys:user:add']"`)
    }
  }
}
