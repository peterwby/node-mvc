const EventEmitter = require('events')

/**
const PerformanceMonitor = require('@Lib/PerformanceMonitor')
const monitor = new PerformanceMonitor()

monitor.start('本次监听的名称')
monitor.step('步骤名称1')
monitor.step('步骤名称2')
monitor.end()
 */
class PerformanceMonitor extends EventEmitter {
  constructor() {
    super()
    this.steps = new Map()
    this.startTime = null
    this.lastStepTime = null
  }

  start(processName = 'main') {
    this.startTime = process.hrtime.bigint()
    this.lastStepTime = this.startTime
    this.steps.clear()
    console.log(`\n=== Starting process: ${processName} ===`)
  }

  step(stepName) {
    const currentTime = process.hrtime.bigint()
    const stepDuration = Number(currentTime - this.lastStepTime) / 1e6 // 转换为毫秒
    const totalDuration = Number(currentTime - this.startTime) / 1e6

    this.steps.set(stepName, {
      stepDuration,
      totalDuration,
      timestamp: new Date(),
    })

    this.lastStepTime = currentTime

    console.log(`Step: ${stepName}`)
    console.log(`└─ Duration: ${stepDuration.toFixed(2)}ms`)
    console.log(`└─ Total time: ${totalDuration.toFixed(2)}ms\n`)

    this.emit('step', {
      name: stepName,
      stepDuration,
      totalDuration,
    })
  }

  end() {
    const endTime = process.hrtime.bigint()
    const totalDuration = Number(endTime - this.startTime) / 1e6

    console.log('=== Performance Summary ===')
    console.log(`Total execution time: ${totalDuration.toFixed(2)}ms\n`)

    // 找出耗时最长的步骤
    const sortedSteps = Array.from(this.steps.entries()).sort((a, b) => b[1].stepDuration - a[1].stepDuration)

    console.log('Top time-consuming steps:')
    sortedSteps.forEach(([name, data], index) => {
      console.log(`${index + 1}. ${name}: ${data.stepDuration.toFixed(2)}ms (${((data.stepDuration / totalDuration) * 100).toFixed(1)}%)`)
    })

    this.emit('end', {
      totalDuration,
      steps: this.steps,
    })

    return {
      totalDuration,
      steps: this.steps,
    }
  }
}

module.exports = PerformanceMonitor
