/*
 * File: common.ts
 * Description: react-service 公共配置
 * Created: 2021-2-4 15:42:04
 * Author: yuzhanglong
 * Email: yuzl1123@163.com
 */

import { Configuration as WebpackConfiguration } from 'webpack'
import { Configuration as WebpackDevServerConfiguration } from 'webpack-dev-server'

export interface ReactPluginOptions {
  // webpack 配置
  webpackConfig?: WebpackConfiguration

  // dev server 配置
  devServerConfig?: WebpackDevServerConfiguration

  // 端口
  port?: number

  // host
  host?: string

  // webpack analysis port
  analysisPort?: number
}
