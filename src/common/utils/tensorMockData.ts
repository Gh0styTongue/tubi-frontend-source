import { FEATURED_CONTAINER_ID, RECOMMENDED_LINEAR_CONTAINER_ID } from 'common/constants/constants';
import FeatureSwitchManager from 'common/services/FeatureSwitchManager';
import type { Sponsorship } from 'common/types/container';

export function getMockSponsorship(): Sponsorship {
  // Taken from original sponsorship campaign
  return {
    brand_name: 'Alter Ego',
    spon_exp: '50305',
    image_urls: {
      brand_background:
        'https://mcdn.tubitv.com/brand_spotlight/alterego/demo/cached/AE_Brand_Background_1920.png?v=mock',
      brand_color: 'https://mcdn.tubitv.com/brand_spotlight/alterego/demo/cached/AE_Brand_Gradient_1x558.png?v=mock',
      brand_logo: 'https://mcdn.tubitv.com/brand_spotlight/alterego/demo/cached/AE_brand_logo_32.png?v=mock',
      brand_graphic: 'https://mcdn.tubitv.com/brand_spotlight/alterego/demo/cached/AE_Brand_Graphic_108.png?v=mock',
      tile_background: 'https://mcdn.tubitv.com/brand_spotlight/alterego/demo/cached/AE_Brand_Gradient_1x228.png?v=mock',
    },
    pixels: {
      homescreen: [
        'https://pixel.staging-public.tubi.io/v2/display/homescreen/3oQb0RHTceC_LfR4eiHR/xMGCKs9z7Bvo1IZrriSYi-NCxdJ1YLr8ZIWdRAGFGE-XLWunwkzQyaAqZe35Ca4HhMpe8lHc6OSSjnIzp6xX9S--5f8ggYo864pXXgOA9j_-r9ngSTtZMb_TCncqdLZEv-tM4tmef3by3qWO4sfrOU95LRwuR_m_mwpvDSWWlAxFw2_3B47jzvnZm1tt3y2I9_XFLmzZM_mqhCDqEvj0Z2v4sRrA4aoJZLQ804ORPRul1uviK9_RAArOs1g=?cb=(ADRISE:CB)',
      ],
      container_list: [
        'https://pixel.staging-public.tubi.io/v2/display/container_list/3oQb0RHTceC_LfR4eiHR/gEkdn6OMCc3sbEgAGh37lyQjChmXM4YkLvFofMWYUEHKn22UWadmHMwUpKA_jTPs2cHmZH9g47-DYVQLdoO0VkufqQgi4j_fhkVwyeUQCzywLrqE3H8KDZjjH1FrJxMKodpQAyq2YWRPadQv_za5qFTLGS0xpuabGQvgKXtKMSVGTuKcn-0hWt1CxkU3BHY4OQ4mDX4xwidz8P0nkf_avPhr4oE0me3bbs5pf_ZarjK0ymJdxx4Z39BDyDUcR6mf?cb=(ADRISE:CB)',
      ],
      container_details: [
        'https://pixel.staging-public.tubi.io/v2/display/container_details/3oQb0RHTceC_LfR4eiHR/AtRziWH7AgY6HodFOeRgrAYSWa02rpSCfrjkalpeuQDAS9Ew5xCErk7vinTW087_dZFPlRFxCdypIsZCUr1lXjzlCCWeHL1vwZBcpJFQTpgOb0g59luy5F4EKltiSALl_TEjX1apxanI2xymNpCWUAXxVR3erW1UYozhxzk0-VbYeKZt4pQk_O1CksWQbwYlko5_vrefWOM4rg9723-MDYp1Ileq5jl7IOsErXQUEZYhcVBQqj7Os5CSNx_uGWM1AEI=?cb=(ADRISE:CB)',
      ],
    },
  };
}

export const insertMockPinnedLinearProgramsToHomeScreen = (body: { containers: { id: string, children?: string[] }[] }) => {
  if (__PRODUCTION__ && !__IS_ALPHA_ENV__) {
    return;
  }

  const shouldMock = FeatureSwitchManager.isEnabled('mockPinnedLinearPrograms');
  if (!shouldMock) {
    return;
  }

  const featuredContainer = body.containers.find(c => c.id === FEATURED_CONTAINER_ID);
  const recLinearContainer = body.containers.find(c => c.id === RECOMMENDED_LINEAR_CONTAINER_ID);

  if (!featuredContainer || !recLinearContainer) {
    return;
  }

  featuredContainer.children = [
    ...(recLinearContainer.children?.slice(0, 2) ?? []),
    ...(featuredContainer.children ?? []),
  ];
};
