/**
 * @jest-environment jsdom
 * @jsx mdx
 */

import React from 'react'
// @ts-expect-error you're not supposed to import those two usually
import { jsx, jsxs, Fragment } from 'react/jsx-runtime'
import * as mdx from '@mdx-js/mdx'
import { MDXProvider, useMDXComponents } from '@mdx-js/react'
import { render } from '@testing-library/react'
import { matchers } from '@emotion/jest'
import { ThemeProvider } from '@theme-ui/core'
import { renderJSON } from '@theme-ui/test-utils'

import { themed, Themed, components, useThemedStylesWithMdx } from '../src'

expect.extend(matchers)

const evalMdx = (str: string) =>
  mdx.evaluate(str, { useMDXComponents, jsx, jsxs, Fragment })

describe(useThemedStylesWithMdx.name, () => {
  it.only('styles React components used in MDX', async () => {
    const Beep = (props: React.ComponentPropsWithoutRef<'p'>) => (
      <p {...props} />
    )

    const { default: BlogPost } = await evalMdx(`
      # The Heading

      <Beep />
    `)

    function MyProvider({ children }) {
      const components = useThemedStylesWithMdx(useMDXComponents({ Beep }))

      return (
        <ThemeProvider
          theme={{
            styles: { Beep: { color: 'tomato' } },
          }}
        >
          <MDXProvider components={components}>{children}</MDXProvider>
        </ThemeProvider>
      )
    }

    const json = renderJSON(
      <MyProvider>
        <BlogPost />
      </MyProvider>
    )!

    console.log('>>', json.children)

    expect(json.type).toBe('p')
    expect(json).toHaveStyleRule('color', 'tomato')
  })
})

test('Themed.div accepts .sx prop', async () => {
  const tree = render(
    <ThemeProvider theme={{ colors: { primary: 'blue' } }}>
      <Themed.div sx={{ color: 'primary' }}>blue text</Themed.div>
    </ThemeProvider>
  )!

  const div = await tree.findByText('blue text')
  const style = global.getComputedStyle(div)

  expect(style.color).toBe('blue')
})

test('themed extracts styles from the theme', () => {
  expect(
    themed('footer')({ styles: { footer: { background: 'skyblue' } } })
  ).toStrictEqual({ background: 'skyblue' })
})

test('keys of components match snapshot', () => {
  expect(Object.keys(components)).toMatchInlineSnapshot(`
    Array [
      "p",
      "b",
      "i",
      "a",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "img",
      "pre",
      "code",
      "ol",
      "ul",
      "li",
      "blockquote",
      "hr",
      "em",
      "table",
      "tr",
      "th",
      "td",
      "strong",
      "del",
      "inlineCode",
      "thematicBreak",
      "div",
      "root",
    ]
  `)
})

test('table columns align', () => {
  const tree = render(
    <MDXProvider>
      <Themed.table>
        <thead>
          <Themed.tr>
            <Themed.th align="left">Left</Themed.th>
            <Themed.th align="center">Center</Themed.th>
            <Themed.th align="right">Right</Themed.th>
          </Themed.tr>
        </thead>
        <tbody>
          <Themed.tr>
            <Themed.td align="left">TextLeft</Themed.td>
            <Themed.td align="center">TextCenter</Themed.td>
            <Themed.td align="right">TextRight</Themed.td>
          </Themed.tr>
        </tbody>
      </Themed.table>
    </MDXProvider>
  )
  expect(tree.getByText('Left')).toHaveStyleRule('text-align', 'left')
  expect(tree.getByText('Center')).toHaveStyleRule('text-align', 'center')
  expect(tree.getByText('Right')).toHaveStyleRule('text-align', 'right')
  expect(tree.getByText('TextLeft')).toHaveStyleRule('text-align', 'left')
  expect(tree.getByText('TextCenter')).toHaveStyleRule('text-align', 'center')
  expect(tree.getByText('TextRight')).toHaveStyleRule('text-align', 'right')
})
