import babel from 'rollup-plugin-babel'
import { terser } from 'rollup-plugin-terser'
export default {
    input: 'src/index.js',
    output: {
        file: 'dist/index.js'
    },
    plugins: [
        babel({
            exclude: 'node_modules/**'
        }),
        terser({
            compress: {
                pure_funcs: ['console.log'] // 去掉console.log函数
            }
        })
    ]
}
