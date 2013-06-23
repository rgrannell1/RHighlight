highlight (naming things is hard!) is a simple client-side .js highlighter for R code, open-sourced so that I can re-use it on my various websites. The highlighter is context-free, with a dash of regex for keywords. This script falls firmly into the camp of "rainbow parentheses" highlighters.

![Bilby Stampede](https://github.com/rgrannell1/highlight/blob/master/less/example.png)

The .highlight_r_code() method has a dependency on Jquery, since I don't feel like writing calls to the DOM in straight javascript.
