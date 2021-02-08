/*
 * File: ServiceManager.ts
 * Description: Service 层管理
 * Created: 2021-1-30 17:58:46
 * Author: yuzhanglong
 * Email: yuzl1123@163.com
 */


import * as path from 'path'
import { PluginModule } from '@attachments/serendipity-public/bin/types/plugin'
import { AppConfig, CommonObject, CreateOptions, InquiryResult } from '@attachments/serendipity-public/bin/types/common'
import {
  writeFilePromise,
  inquirer,
  runCommand,
  webpackMerge,
  logger,
  serendipityEnv
} from '@attachments/serendipity-public'
import { ServiceModule } from '@attachments/serendipity-public/bin/types/cliService'
import PluginManager from './pluginManager'

class ServiceManager {
  private readonly basePath: string
  private readonly serviceModule: ServiceModule
  private readonly appConfig: AppConfig
  private readonly createOptions: CreateOptions

  private inquiryResult: InquiryResult
  private pluginManagers: PluginManager[] = []
  private packageConfig: CommonObject

  constructor(basePath: string, createOptions: CreateOptions, service: ServiceModule) {
    this.createOptions = createOptions
    this.serviceModule = service
    this.basePath = basePath
    this.appConfig = {}
  }

  /**
   * 获得所有的 plugin 管理器
   *
   * @author yuzhanglong
   * @date 2021-1-30 19:12:51
   */
  getPluginManagers(): PluginManager[] {
    return this.pluginManagers
  }

  /**
   * 初始化 package.json
   *
   * @author yuzhanglong
   * @param config package.json 内容
   * @date 2021-1-29 13:48:49
   */
  setPackageConfig(config: CommonObject): void {
    this.packageConfig = config
  }

  /**
   * 注册 plugin 接口
   *
   * @author yuzhanglong
   * @param name plugin 名称
   * @param pluginModule plugin 模块（require 后）
   * @date 2021-1-30 19:14:42
   */
  registerPlugin(name: string, pluginModule: PluginModule): void {
    const manager = new PluginManager(
      this.basePath,
      name,
      pluginModule,
      this.appConfig,
      this.packageConfig,
      this.inquiryResult,
      this.createOptions
    )
    this.pluginManagers.push(manager)
  }

  /**
   * 执行 plugin 模板钩子
   *
   * @author yuzhanglong
   * @date 2021-1-29 11:51:36
   */
  runPluginsTemplate(): void {
    for (const pluginManager of this.pluginManagers) {
      pluginManager.runConstruction()
    }
  }

  /**
   * 写入 package.json
   *
   * @author yuzhanglong
   * @date 2021-1-30 12:33:08
   */
  async writePackageConfig(): Promise<void> {
    await writeFilePromise(
      path.resolve(this.basePath, 'package.json'),
      // 默认 2 缩进
      JSON.stringify(this.packageConfig, null, 2)
    )
  }

  /**
   * 准备 app 配置文件，这个配置文件面向用户
   * 用户可以在这个配置文件中进行一些操作，例如修改 webpack 配置等
   *
   * @author yuzhanglong
   * @date 2021-2-2 20:32:45
   */
  async setAppConfig(): Promise<void> {
    // 收集所有插件的 AppConfig
    // 由于 webpackMerge 库返回的对象是一个新的对象，this.appConfig 不会被插件接口修改，所以我们还要再遍历一遍并合并
    let lastResult = this.collectAppConfig()

    // 收集所有的 plugin 名称
    const names = this.pluginManagers.map((data) => data.name)

    // 合并用户注册的 plugins 到 config 文件中
    lastResult = webpackMerge(lastResult, {
      plugins: names
    })

    await ServiceManager.writeAppConfig(this.basePath, lastResult)
  }

  /**
   * 写入 App 配置文件
   *
   * @param res 配置文件内容
   * @param target 目标目录
   * @author yuzhanglong
   * @date 2021-2-5 21:35:05
   */
  static async writeAppConfig(target: string, res: AppConfig): Promise<void> {
    // stringify
    const jsonifyResult = JSON.stringify(res, null, 2)
    const result = `module.exports = ${jsonifyResult}`
    await writeFilePromise(
      path.resolve(target, 'serendipity.js'),
      result
    )
  }

  /**
   * 收集 app 配置
   *
   * @author yuzhanglong
   * @date 2021-2-3 00:13:02
   */
  collectAppConfig(): AppConfig {
    const reducer = ((previousValue: PluginManager, currentValue: PluginManager) => {
      return webpackMerge(previousValue, currentValue)
    })
    // 从各个 plugin 合并而来
    return this.pluginManagers.reduce(reducer).appConfig
  }

  /**
   * 执行工程创建时 serviceModule 的能力，例如初始化 package.json 配置
   *
   * @author yuzhanglong
   * @date 2021-1-30 18:54:44
   */
  runCreateWorkTasks(): void {
    this.serviceModule.service({
      setPackageConfig: this.setPackageConfig.bind(this),
      registerPlugin: this.registerPlugin.bind(this),
      inquiryResult: this.inquiryResult
    })
  }

  /**
   * 为 serviceModule 管理的目录 初始化 git
   *
   * @author yuzhanglong
   * @date 2021-1-30 19:27:18
   */
  async initServiceGit(): Promise<void> {
    logger.log('正在初始化 git 仓库...')
    await runCommand('git init', [], this.basePath)
  }

  /**
   * 初始化构建后提交
   *
   * @author yuzhanglong
   * @date 2021-1-30 19:37:54
   */
  async initFirstCommit(message: string): Promise<void> {
    await runCommand('git add -A', [], this.basePath)
    await runCommand('git', ['commit', '-m', message, '--no-verify'], this.basePath)
  }

  /**
   * 安装所有依赖
   *
   * @author yuzhanglong
   * @date 2021-2-2 19:50:10
   */
  async install(): Promise<void> {
    await runCommand('yarn install', [], this.basePath)
  }

  /**
   * 执行 serviceModule inquirer
   *
   * @author yuzhanglong
   * @date 2021-2-4 12:40:24
   */
  async runServiceInquirer(): Promise<void> {
    if (this.serviceModule.inquiry) {
      const result = this.serviceModule.inquiry({
        createOptions: this.createOptions
      })
      if (!serendipityEnv.isSerendipityDevelopment()) {
        this.inquiryResult = await inquirer.prompt(result)
      } else {
        this.inquiryResult = {}
      }
    }
  }
}

export default ServiceManager