/*
 * File: ReactService.ts
 * Description: ReactService 核心
 * Created: 2021-2-2 18:34:12
 * Author: yuzhanglong
 * Email: yuzl1123@163.com
 */


import { configFile } from '../utils/paths'
import { AppConfig } from '../types/appConfig'
import merge from 'webpack-merge'
import baseConfig from '../webpack/webpackBase'
import { Configuration, webpack } from 'webpack'
import { PluginModule } from '@attachments/serendipity-public/bin/types/plugin'
import logger from '@attachments/serendipity-public/bin/utils/logger'
import * as WebpackDevServer from 'webpack-dev-server'
import devServerConfig from '../webpack/devServer'
import * as fs from 'fs'

class ReactService {
  private readonly appConfig: AppConfig
  private readonly devServerConfig: unknown

  private webpackConfig: Configuration

  constructor() {
    this.appConfig = fs.existsSync(configFile) ? require(configFile) : {}
    this.webpackConfig = baseConfig
    this.devServerConfig = devServerConfig
  }

  private mergeWebpackConfig(...configurations: Configuration[]): void {
    this.webpackConfig = merge(this.webpackConfig, ...configurations)
  }


  private runRuntimePlugins(): void {
    if (Array.isArray(this.appConfig.plugins)) {
      for (const plugin of this.appConfig.plugins) {
        const pluginModule: PluginModule = require(plugin)
        pluginModule.runtime({
          mergeWebpackConfig: this.mergeWebpackConfig.bind(this)
        })
      }
    }
  }

  public start(): void {
    // 执行插件运行时逻辑
    this.runRuntimePlugins()

    // 尝试从用户配置文件中获取配置，它的优先级较高
    if (this.appConfig && this.appConfig.webpackConfig) {
      this.mergeWebpackConfig(this.appConfig.webpackConfig)
    }

    // 初始化 webpack compiler 见 webpack node.js API
    const compiler = webpack(this.webpackConfig)

    // devServer 选项合并
    const devServerOptions = Object.assign({}, this.devServerConfig, {
      open: true
    })

    // 启动 webpackDevServer 服务器
    const server = new WebpackDevServer(compiler, devServerOptions)

    // 监听端口
    // TODO: 端口配置化而不是写死
    server.listen(8080, '127.0.0.1', () => {
      logger.done('the server is running successfully~')
    })
  }
}

export default ReactService