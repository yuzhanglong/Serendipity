import { Construction, Inquiry, Runtime, Script, SerendipityPlugin } from '@attachments/serendipity-scripts'
import { ConstructionOptions, RuntimeOptions } from '@attachments/serendipity-scripts/bin/types/pluginExecute'


@SerendipityPlugin('my-plugin')
class MyPlugin {
  @Construction()
  myConstruction(options: ConstructionOptions) {
    // 在构建模式下做些什么
  }

  @Runtime()
  myRuntime(options: RuntimeOptions) {
    // 在 runtime 模式下做些什么
  }

  @Inquiry()
  myInquiry() {
    // 发起质询
    return []
  }

  @Script('hello-world')
  myScript() {
    // 在用户执行 serendipity-scripts hello-world 之后 做些什么
  }
}

export default MyPlugin
