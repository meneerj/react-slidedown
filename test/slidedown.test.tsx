import React from 'react'
import { createRoot, Root } from 'react-dom/client'
import { act } from 'react'
import { describe, it, expect, beforeEach } from 'vitest'
import { SlideDown } from '../lib/slidedown'

/* async/await sleep */
function pause(millis) {
    return new Promise(resolve => setTimeout(resolve, millis))
}

function setupContainer() {
    const attachTo = document.createElement('div')
    document.body.appendChild(attachTo)
    return attachTo
}

describe('SlideDown', () => {
    let attachTo: HTMLDivElement | null = null
    let root: Root | null = null

    beforeEach(() => {
        if (!attachTo) {
            attachTo = setupContainer()
        }
        if (root) {
            root.unmount()
            root = null
        }
    })

    function render(element: React.ReactElement) {
        if (!attachTo) attachTo = setupContainer()
        root = createRoot(attachTo!)
        act(() => {
            root!.render(element)
        })
        return {
            container: attachTo!,
            rerender: (el: React.ReactElement) => act(() => root!.render(el)),
            unmount: () => root!.unmount(),
        }
    }

    describe('simple rendering', () => {
        it('renders no children when empty', () => {
            const { container } = render(<SlideDown></SlideDown>)
            const el = container.firstElementChild as HTMLElement
            expect(el).toBeTruthy()
            expect(el.children.length).toBe(0)
        })

        it('renders content when present', () => {
            const { container } = render(<SlideDown>findme</SlideDown>)
            const el = container.firstElementChild as HTMLElement
            expect(el.textContent).toBe('findme')
        })

        it('renders container div with class react-slidedown', () => {
            const { container } = render(<SlideDown>anything</SlideDown>)
            const el = container.firstElementChild as HTMLElement
            expect(el.classList.contains('react-slidedown')).toBe(true)
        })

        it('adds className property to container', () => {
            const { container } = render(<SlideDown className="my-class">slideme</SlideDown>)
            const el = container.firstElementChild as HTMLElement
            expect(el.classList.contains('react-slidedown')).toBe(true)
            expect(el.classList.contains('my-class')).toBe(true)
        })

        it('adds other props to container div', () => {
            const ref = React.createRef<HTMLDivElement>()
            render(<SlideDown ref={ref} id="my-id">slideme</SlideDown>)
            expect(ref.current!.id).toBe('my-id')
        })

        it('forwards object ref to outer div', () => {
            const ref = React.createRef<HTMLDivElement>()
            render(<SlideDown ref={ref} className="my-class">slideme</SlideDown>)
            expect(ref.current!.tagName).toBe('DIV')
            expect(ref.current!.classList.contains('my-class')).toBe(true)
        })

        it('forwards function ref to outer div', () => {
            let current: HTMLDivElement | null = null
            const refFn = (ref: HTMLDivElement | null) => current = ref
            render(<SlideDown ref={refFn} className="my-class">slideme</SlideDown>)
            expect(current!.tagName).toBe('DIV')
            expect(current!.classList.contains('my-class')).toBe(true)
        })

        it('renders different element type when "as" prop is provided', () => {
            const ref = React.createRef<HTMLDivElement>()
            render(<SlideDown ref={ref} as="span">slideme</SlideDown>)
            expect(ref.current!.tagName).toBe('SPAN')
        })
    })

    describe('children', () => {
        it('transitions when children are added', async () => {
            const { container, rerender } = render(<SlideDown className="test-slidedown"></SlideDown>)
            const el = container.querySelector('.react-slidedown') as HTMLElement
            rerender(<SlideDown className="test-slidedown"><div className="test-content" /></SlideDown>)
            expect(el.clientHeight).toBe(0)
            await pause(110)
            expect(el.clientHeight).toBe(18)
        })

        it('transitions when children are removed', async () => {
            const { container, rerender } = render(<SlideDown className="test-slidedown" transitionOnAppear={false}><div className="test-content" /></SlideDown>)
            const el = container.querySelector('.react-slidedown') as HTMLElement
            expect(el.clientHeight).toBe(18)
            rerender(<SlideDown className="test-slidedown" transitionOnAppear={false}>{null}</SlideDown>)
            expect(el.clientHeight).toBe(18)
            await pause(150)
            expect(el.clientHeight).toBe(0)
        })

        it('reverses transition when item is removed half-way through', async () => {
            const { container, rerender } = render(<SlideDown className="test-slidedown"><div className="test-content" /></SlideDown>)
            const el = container.querySelector('.react-slidedown') as HTMLElement
            expect(el.clientHeight).toBe(0)
            await pause(50)
            const midHeight = el.clientHeight
            expect(midHeight).toBeLessThan(18)

            rerender(<SlideDown className="test-slidedown">{null}</SlideDown>)
            expect(el.clientHeight).toBe(midHeight)
            await pause(50)
            expect(el.clientHeight).toBeLessThan(midHeight)
            await pause(60)
            expect(el.clientHeight).toBe(0)
        })
    })

    describe('transitionOnAppear', () => {
        it('transitions on mounting', async () => {
            const { container } = render(<SlideDown className="test-slidedown"><div className="test-content" /></SlideDown>)
            const el = container.querySelector('.react-slidedown') as HTMLElement
            expect(el.clientHeight).toBe(0)
            await pause(110)
            expect(el.clientHeight).toBe(18)
        })

        it('does not transition on mounting when transitionOnAppear is false', () => {
            const { container } = render(<SlideDown className="test-slidedown" transitionOnAppear={false}><div className="test-content" /></SlideDown>)
            const el = container.querySelector('.react-slidedown') as HTMLElement
            expect(el.clientHeight).toBe(18)
        })
    })

    describe('closed property', () => {
        it('sets closed class on container when mounted with closed property set', () => {
            const { container } = render(<SlideDown closed={true}><div className="findme" /></SlideDown>)
            const el = container.querySelector('.react-slidedown') as HTMLElement
            expect(el.classList.contains('closed')).toBe(true)
            const { container: container2 } = render(<SlideDown closed={false}><div className="findme" /></SlideDown>)
            const el2 = container2.querySelector('.react-slidedown') as HTMLElement
            expect(el2.classList.contains('closed')).toBe(false)
        })

        it('renders children when closed property is set', () => {
            const { container } = render(<SlideDown closed={true}><div className="findme" /></SlideDown>)
            expect(container.querySelectorAll('.findme').length).toBe(1)
        })

        it('does not transition on mounting when closed property is set', async () => {
            const { container } = render(<SlideDown className="test-slidedown" closed={true}><div className="test-content" /></SlideDown>)
            const el = container.querySelector('.react-slidedown') as HTMLElement
            expect(el.clientHeight).toBe(0)
            await pause(110)
            expect(el.clientHeight).toBe(0)
        })

        it('transitions when closed property is updated to false', async () => {
            const { container, rerender } = render(<SlideDown className="test-slidedown" closed={true}><div className="test-content" /></SlideDown>)
            const el = container.querySelector('.react-slidedown') as HTMLElement
            expect(el.clientHeight).toBe(0)
            rerender(<SlideDown className="test-slidedown" closed={false}><div className="test-content" /></SlideDown>)
            expect(el.clientHeight).toBe(0)
            await pause(110)
            expect(el.clientHeight).toBe(18)
        })

        it('transitions when closed property is updated to true', async () => {
            const { container, rerender } = render(<SlideDown className="test-slidedown" closed={false} transitionOnAppear={false}><div className="test-content" /></SlideDown>)
            const el = container.querySelector('.react-slidedown') as HTMLElement
            expect(el.clientHeight).toBe(18)
            rerender(<SlideDown className="test-slidedown" closed={true} transitionOnAppear={false}><div className="test-content" /></SlideDown>)
            expect(el.clientHeight).toBe(18)
            await pause(110)
            expect(el.clientHeight).toBe(0)
        })

        it('reverses transition when closed property is set half-way through opening', async () => {
            const { container, rerender } = render(<SlideDown className="test-slidedown"><div className="test-content" /></SlideDown>)
            const el = container.querySelector('.react-slidedown') as HTMLElement
            await pause(50)
            const midHeight = el.clientHeight
            expect(midHeight).toBeLessThan(18)

            rerender(<SlideDown className="test-slidedown" closed={true}><div className="test-content" /></SlideDown>)
            expect(el.clientHeight).toBe(midHeight)
            await pause(50)
            expect(el.clientHeight).toBeLessThan(midHeight)
            await pause(60)
            expect(el.clientHeight).toBe(0)
        })
    })
})
