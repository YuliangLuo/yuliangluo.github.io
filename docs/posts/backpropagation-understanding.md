---
title: 反向传播的理解：从链式法则到最小自动微分
date: 2026-06-04
tags: [Backpropagation, Autograd, Machine Learning]
---

# 反向传播的理解：从链式法则到最小自动微分

反向传播本质上是链式法则在计算图上的系统化应用。它不是某个神秘算法，而是把“最终损失对每个参数的影响”从输出节点一路反推到输入和权重。

## 1. 先看一个标量计算图

假设：

```text
y = (a * b + c)^2
```

拆成节点：

```text
a ----\
       mul ----\
b ----/         add ---- pow2 ---- y
c -------------/
```

每个节点只需要知道两件事：

```text
forward: 这个节点怎么算出输出
backward: 上游梯度来了以后，怎么分发给输入
```

## 2. 什么是梯度

如果最终 loss 是 `L`，某个变量是 `w`，那么：

```text
dL/dw
```

表示 `w` 变化一点点时，最终 loss 会怎么变化。

- `dL/dw > 0`：增大 `w` 会让 loss 变大，所以训练时应减小 `w`
- `dL/dw < 0`：增大 `w` 会让 loss 变小，所以训练时应增大 `w`
- `dL/dw = 0`：局部来看，`w` 对 loss 没有影响，或者处于平坦区域

参数更新就是：

```text
w = w - learning_rate * dL/dw
```

## 3. 局部梯度与上游梯度

反向传播最重要的概念是：

```text
当前节点输入的梯度 = 上游梯度 × 当前节点的局部导数
```

例如：

```text
y = x^2
```

局部导数：

```text
dy/dx = 2x
```

如果上游传来：

```text
dL/dy
```

那么：

```text
dL/dx = dL/dy * dy/dx = dL/dy * 2x
```

这就是链式法则。

## 4. 常见操作的 backward 规则

| Operation | Forward | Backward 含义 |
|---|---|---|
| add | `z = x + y` | `dz/dx = 1`, `dz/dy = 1`，梯度原样分给两边 |
| sub | `z = x - y` | 对 `x` 是 `+1`，对 `y` 是 `-1` |
| mul | `z = x * y` | 对 `x` 的梯度乘 `y`，对 `y` 的梯度乘 `x` |
| pow | `z = x^n` | `dz/dx = n * x^(n-1)` |
| div | `z = x / y` | 可看成 `x * y^-1` |
| exp | `z = exp(x)` | `dz/dx = exp(x)` |
| log | `z = log(x)` | `dz/dx = 1/x` |
| tanh | `z = tanh(x)` | `dz/dx = 1 - tanh(x)^2` |

这些规则只描述单个节点的局部行为。完整神经网络只是把大量节点连在一起。

## 5. 最小 Value 对象

```python
class Value:
    def __init__(self, data, children=(), op=''):
        self.data = float(data)
        self.grad = 0.0
        self._prev = set(children)
        self._op = op
        self._backward = lambda: None

    def __add__(self, other):
        other = other if isinstance(other, Value) else Value(other)
        out = Value(self.data + other.data, (self, other), '+')

        def _backward():
            self.grad += 1.0 * out.grad
            other.grad += 1.0 * out.grad

        out._backward = _backward
        return out

    def __mul__(self, other):
        other = other if isinstance(other, Value) else Value(other)
        out = Value(self.data * other.data, (self, other), '*')

        def _backward():
            self.grad += other.data * out.grad
            other.grad += self.data * out.grad

        out._backward = _backward
        return out

    def __pow__(self, n):
        out = Value(self.data ** n, (self,), f'**{n}')

        def _backward():
            self.grad += n * (self.data ** (n - 1)) * out.grad

        out._backward = _backward
        return out
```

关键点是：每次 forward 都创建一个新节点，并把这个节点的 backward 逻辑保存下来。

## 6. 为什么要反向拓扑排序

如果一个节点依赖另一个节点，那么反向传播时必须先算后面的节点，再算前面的节点。

```python
def backward(self):
    topo = []
    visited = set()

    def build(v):
        if v not in visited:
            visited.add(v)
            for child in v._prev:
                build(child)
            topo.append(v)

    build(self)
    self.grad = 1.0
    for node in reversed(topo):
        node._backward()
```

`self.grad = 1.0` 的含义是：

```text
dL/dL = 1
```

也就是最终 loss 对自己的导数是 1。

## 7. 一个训练例子

线性模型：

```text
pred = w * x + b
loss = (pred - target)^2
```

训练要做的事情：

```text
1. forward: 算 pred 和 loss
2. backward: 算 dloss/dw 和 dloss/db
3. update: w -= lr * w.grad, b -= lr * b.grad
4. zero grad: 清空梯度，进入下一轮
```

工程上容易犯的错误：

| 问题 | 后果 |
|---|---|
| 忘记清空 grad | 梯度会跨 epoch 累加，训练异常 |
| 学习率太大 | loss 震荡甚至发散 |
| 没有拓扑排序 | 某些节点梯度还没准备好就被使用 |
| 原地修改 data | 破坏计算图一致性 |

## 8. 一句话总结

反向传播就是：

```text
先按计算图 forward 保存中间关系；
再从 loss 开始，把上游梯度按每个节点的局部导数一路传回去；
最后用参数梯度更新权重。
```

理解了这一点，再看 PyTorch、JAX、TensorFlow 的 autograd，本质上就是更大规模、更高性能、更严谨的同一套机制。
