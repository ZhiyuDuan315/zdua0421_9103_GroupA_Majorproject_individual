# Zhiyu's Personal Part of the Creative Programming Professional Project
## Interaction Guidelines
Simply open index.html in your browser, and the animation will start automatically; no buttons or keystrokes are required. The circular patterns in the animation are positioned fixed on the screen, but their edges, halos, and the background noise will slowly change. If you refresh the page, the position and color scheme of the circular patterns will be randomly generated again. If you resize the browser window, the canvas will automatically scale accordingly.

## Visual and Code Design Details

The background consists of rows of vertical rectangles, each with its color and transparency determined by Perlin noise. These rectangles slowly shift over time, creating a flowing band of light resembling the aurora borealis.

The images utilize the circular graphics from the team's code, employing simple logic to prevent overlapping and ensure they don't clump together.

The `noisyRadius()` function is used to slightly noise-perturb the radius based on angle and time when drawing the radial lines and raster rings, creating undulating edges.

`drawAura()` is used to overlay multiple layers of noisy halo outlines on each circle, varying their transparency and radius to resemble a slightly undulating mist surrounding the pattern.

## Differences from the Group Project

In the group's code, the circular graphic continuously falls from top to bottom, resetting to the top upon reaching the bottom and falling again. The size and transparency of the halo are also tied to the falling progress. In my personal version, the circular graphic's position on the screen doesn't move. The falling and resetting are removed, allowing the edges of the background and the graphic itself, as well as the halo, to slowly change through Perlin noise. Furthermore, while the group's halo is a simple circular diffusion, I changed it to a cloud-like halo composed of multiple layers of noise contours, giving the feeling that the internal details are slowly breathing.

## Inspiration

![Inspiration image](readmeImages/Radial_Perlin_Noise_and_Generative_Tree_Rings.jpg)
![Inspiration image](readmeImages/Geometric_Mandala_Light.gif)
The visuals were primarily inspired by two types of images: First, the noise contour plots resembling tree rings in Gorilla Sun's *Radial Perlin Noise and Generative Tree Rings*, which gave me the feeling of circles being slightly stretched by noise and having irregularly undulating edges. I converted this effect into a multi-layered halo structure in the code. Second, the geometric mandala glowing animation released by xponentialdesign on GIPHY, with multiple layers of radial lines and polygons superimposed on a black background, helped me determine the current "spokes + dots" geometric mandala framework and highly 
saturated color scheme.

## References & Acknowledgments

1.Using Gorilla Sun's article "An Introduction to Perlin Noise in P5JS and Processing," learn how to perform non-linear mappings like pow(n, 0.9) on top of Perlin noise, and apply this method to the background vertical light bands and noisyRadius() to make the highlights more prominent and the edges more undulating: [An introduction to Perlin Noise in P5JS and Processing](https://www.gorillasun.de/blog/an-introduction-to-perlin-noise-in-p5js-and-processing/)
2.Use the beginShape() / vertex() / endShape() examples from the p5.js documentation to implement the irregular noise contours in the halo area, instead of a simple circle: [Reference](https://p5js.org/reference/#/p5/beginShape)
3.Learn how to create more complex organic shapes using a series of vertices from The Coding Train's "Custom Shapes" tutorial video, and apply this approach to the jittery contours of a halo edge: [Reference](https://www.youtube.com/watch?v=76fiD5DvzeQ)
4.Using Daniel Shiffman's *The Nature of Code* as a conceptual reference, we can understand the ideas of sampling in higher-dimensional noise spaces, distorting boundary lines with noise, and generating noise fields. These ideas can then be integrated into the design of time seeds and cloud halos, such as ring.nShape and ring.nAura.: [THE NATURE OF CODE](https://natureofcode.com/)
The main code is derived from classroom materials
