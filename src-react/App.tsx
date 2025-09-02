import React from 'react'

const App: React.FC = () => {
  return (
    <div className="app-layout">
      <div className="flex-center h-screen">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            🎨 miniPaint React
          </h1>
          <p className="text-gray-600 mb-8">
            React 18 重构版本正在开发中...
          </p>
          <div className="flex gap-4 justify-center">
            <button className="btn">
              开始创作
            </button>
            <button className="btn-secondary">
              查看原版
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App