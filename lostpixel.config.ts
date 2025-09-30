import { CustomProjectConfig } from 'lost-pixel';

// Ran in MinGW with `docker run --rm -v '//c/Users/remcc/paracharts:/usr/workdir' -e 'WORKSPACE=/usr/workdir' -e DOCKER=1 -e LOST_PIXEL_MODE=update lostpixel/lost-pixel:v3.22.0`
export const config: CustomProjectConfig = {
  storybookShots: {
    storybookUrl: './storybook-static',
  },
  // OSS mode 
  generateOnly: true,
  failOnDifference: true
  
  // Lost Pixel Platform (to use in Platform mode, comment out the OSS mode and uncomment this part )
  // lostPixelProjectId: "xxxx",
  // process.env.LOST_PIXEL_API_KEY,
};