const plugin = require('tailwindcss/plugin')

module.exports = plugin(({ addComponents, theme }) => {
  // Fixed
  addComponents({
    '.container-fixed': {
      'flex-grow': '1',
      width: '100%',
      'padding-inline-start': theme('custom.components.container.fixed.px.DEFAULT'),
      'padding-inline-end': theme('custom.components.container.fixed.px.DEFAULT'),
    },
    [`@media (min-width: ${theme('screens.xl')})`]: {
      '.container-fixed': {
        'margin-inline-start': 'auto',
        'margin-inline-end': 'auto',
        'padding-inline-start': theme('custom.components.container.fixed.px.xl'),
        'padding-inline-end': theme('custom.components.container.fixed.px.xl'),
        'max-width': theme('custom.components.container.fixed')['max-width'],
      },
    },
  })

  // Fluid
  addComponents({
    '.container-fluid': {
      width: '100%',
      'flex-grow': '1',
      'padding-inline-start': theme('custom.components.container.fluid.px.DEFAULT'),
      'padding-inline-end': theme('custom.components.container.fluid.px.DEFAULT'),
    },
    [`@media (min-width: ${theme('screens.xl')})`]: {
      '.container-fluid': {
        'padding-inline-start': theme('custom.components.container.fluid.px.xl'),
        'padding-inline-end': theme('custom.components.container.fluid.px.xl'),
      },
    },
  })
})
