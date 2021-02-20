/*
 * File: decorators.ts
 * Description: 装饰器模块
 * Created: 2021-2-19 20:55:04
 * Author: yuzhanglong
 * Email: yuzl1123@163.com
 */

import 'reflect-metadata'
import { PLUGIN_SCRIPT_META_KEY, PLUGIN_NAME_META_KEY, PLUGIN_INQUIRY_META_KEY } from '../common/pluginMetaKeys'


export const Script = (command: string) => {
  return (target: unknown, key: string, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata(PLUGIN_SCRIPT_META_KEY, command, descriptor.value)
  }
}

export const SerendipityPlugin = (name: string) => {
  return (target) => {
    // 定义 name 元数据
    Reflect.defineMetadata(PLUGIN_NAME_META_KEY, name, target)
  }
}


export const Inquiry = () => {
  return (target: unknown, key: string, descriptor: PropertyDescriptor) => {
    // 定义 name 元数据
    Reflect.defineMetadata(PLUGIN_INQUIRY_META_KEY, true, descriptor.value)
  }
}