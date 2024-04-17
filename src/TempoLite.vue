<template>
<v-app
  id="app"
  :style="cssVars"
>
  <div
    id="main-content"
  >
  
    <div class="content-with-sidebars">
      <div>
        <div id="map"></div>
        <div>
          <img src="./assets/colorbar.png" width="487" height="102">
        </div>
        <div id="slider-row">
        <icon-button
          :fa-icon="playing ? 'pause' : 'play'"
          @activate="playOrPause"
        ></icon-button>
          <v-slider
            v-model="timeIndex"
            :min="0"
            :max="maxIndex"
            :step="1"
            color="#068ede95"
            thumb-label="always"
          >
            <template v-slot:thumb-label="{ modelValue }">
              <div class="thumb-label">
                {{ datetimes[modelValue] }}
              </div>
            </template>
          </v-slider>
        </div>
      </div>
  
      <div>
      <article>
        <h2>TEMPO Data</h2>
        <p>Some descriptive text about TEMPO and the data we are showing here.</p>
      </article>
      </div>
      <div>
        <v-btn
          id="home"
          @click="() => {
            map?.fitBounds(bounds);
            timeIndex = 0;
          }"
        >
          Home
        </v-btn>
        <br>
        <v-btn
          id="texas"
          @click="() => {
            map?.fitBounds(texasBounds);
            timeIndex = 10;
          }"
        >
          Texas
        </v-btn>
        <br>
        <v-btn
          id="northeast"
          @click="() => {
            map?.fitBounds(northeastBounds);
            timeIndex = 72;
          }"
        >
          Northeast
        </v-btn>
      </div>
    </div>

    <location-search
      v-model="searchOpen"
      small
      buttonSize="xl"
      :search-provider="geocodingInfoForSearch"
      :accentColor="accentColor"
      @set-location="(feature: MapBoxFeature) => {
        map?.setView([feature.center[1], feature.center[0]], 6);
      }"
      @error="(error: string) => searchErrorMessage = error"
    ></location-search>

    <!-- This contains the splash screen content -->

    <v-overlay
      :model-value="showSplashScreen"
      absolute
      opacity="0.6"
      :style="cssVars"
      id="splash-overlay"
    >
      <div
        id="splash-screen"
        v-click-outside="closeSplashScreen"
        :style="cssVars"
      >
        <div
          id="close-splash-button"
          @click="closeSplashScreen"
          >&times;
        </div>
        <div id="splash-screen-text">
          <p>Splash Screen Content</p>
        </div>
        <div id="splash-screen-acknowledgements" class="small">
          This Data Story is brought to you by <a href="https://www.cosmicds.cfa.harvard.edu/" target="_blank" rel="noopener noreferrer">Cosmic Data Stories</a> and <a href="https://www.worldwidetelescope.org/home/" target="_blank" rel="noopener noreferrer">WorldWide Telescope</a>.
          
          <div id="splash-screen-logos">
            <credit-logos logo-size="5vmin"/>
          </div>
        </div>
      </div>
    </v-overlay>

  </div>
</v-app>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import L, { Map } from "leaflet";

// We DO use MapBoxFeature in the template, but eslint isn't picking this up for some reason
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { MapBoxFeature, MapBoxFeatureCollection, geocodingInfoForSearch } from "./mapbox";

type SheetType = "text" | "video" | null;
type Timeout = ReturnType<typeof setTimeout>;

const datetimes = [
  'Sun, Dec 17, 2023 -- 12:24 (UTC)',
  'Sun, Dec 17, 2023 -- 13:04 (UTC)',
  'Sun, Dec 17, 2023 -- 13:44 (UTC)',
  'Sun, Dec 17, 2023 -- 14:24 (UTC)',
  'Sun, Dec 17, 2023 -- 15:04 (UTC)',
  'Sun, Dec 17, 2023 -- 16:04 (UTC)',
  'Sun, Dec 17, 2023 -- 17:04 (UTC)',
  'Sun, Dec 17, 2023 -- 18:04 (UTC)',
  'Sun, Dec 17, 2023 -- 19:04 (UTC)',
  'Sun, Dec 17, 2023 -- 20:04 (UTC)',
  'Sun, Dec 17, 2023 -- 21:04 (UTC)',
  'Sun, Dec 17, 2023 -- 21:44 (UTC)',
  'Sun, Dec 17, 2023 -- 22:24 (UTC)',
  'Sun, Dec 17, 2023 -- 23:04 (UTC)',
  'Mon, Dec 18, 2023 -- 12:24 (UTC)',
  'Mon, Dec 18, 2023 -- 13:04 (UTC)',
  'Mon, Dec 18, 2023 -- 13:45 (UTC)',
  'Mon, Dec 18, 2023 -- 14:25 (UTC)',
  'Mon, Dec 18, 2023 -- 15:05 (UTC)',
  'Mon, Dec 18, 2023 -- 16:05 (UTC)',
  'Mon, Dec 18, 2023 -- 17:05 (UTC)',
  'Mon, Dec 18, 2023 -- 18:05 (UTC)',
  'Mon, Dec 18, 2023 -- 19:05 (UTC)',
  'Mon, Dec 18, 2023 -- 20:05 (UTC)',
  'Mon, Dec 18, 2023 -- 21:05 (UTC)',
  'Mon, Dec 18, 2023 -- 21:45 (UTC)',
  'Mon, Dec 18, 2023 -- 22:25 (UTC)',
  'Mon, Dec 18, 2023 -- 23:05 (UTC)',
  'Tue, Dec 19, 2023 -- 12:25 (UTC)',
  'Tue, Dec 19, 2023 -- 13:05 (UTC)',
  'Tue, Dec 19, 2023 -- 13:45 (UTC)',
  'Tue, Dec 19, 2023 -- 14:25 (UTC)',
  'Tue, Dec 19, 2023 -- 15:05 (UTC)',
  'Tue, Dec 19, 2023 -- 16:05 (UTC)',
  'Tue, Dec 19, 2023 -- 17:05 (UTC)',
  'Tue, Dec 19, 2023 -- 18:05 (UTC)',
  'Tue, Dec 19, 2023 -- 19:05 (UTC)',
  'Tue, Dec 19, 2023 -- 20:05 (UTC)',
  'Tue, Dec 19, 2023 -- 21:05 (UTC)',
  'Tue, Dec 19, 2023 -- 21:45 (UTC)',
  'Tue, Dec 19, 2023 -- 22:25 (UTC)',
  'Tue, Dec 19, 2023 -- 23:05 (UTC)',
  'Wed, Dec 20, 2023 -- 12:25 (UTC)',
  'Wed, Dec 20, 2023 -- 13:05 (UTC)',
  'Wed, Dec 20, 2023 -- 13:46 (UTC)',
  'Wed, Dec 20, 2023 -- 14:26 (UTC)',
  'Wed, Dec 20, 2023 -- 15:06 (UTC)',
  'Wed, Dec 20, 2023 -- 16:06 (UTC)',
  'Wed, Dec 20, 2023 -- 17:06 (UTC)',
  'Wed, Dec 20, 2023 -- 18:06 (UTC)',
  'Wed, Dec 20, 2023 -- 19:06 (UTC)',
  'Wed, Dec 20, 2023 -- 20:06 (UTC)',
  'Wed, Dec 20, 2023 -- 21:06 (UTC)',
  'Wed, Dec 20, 2023 -- 21:46 (UTC)',
  'Wed, Dec 20, 2023 -- 22:26 (UTC)',
  'Wed, Dec 20, 2023 -- 23:06 (UTC)',
  'Thu, Dec 21, 2023 -- 12:46 (UTC)',
  'Thu, Dec 21, 2023 -- 13:26 (UTC)',
  'Thu, Dec 21, 2023 -- 14:06 (UTC)',
  'Thu, Dec 21, 2023 -- 15:06 (UTC)',
  'Thu, Dec 21, 2023 -- 16:06 (UTC)',
  'Thu, Dec 21, 2023 -- 17:06 (UTC)',
  'Thu, Dec 21, 2023 -- 18:06 (UTC)',
  'Thu, Dec 21, 2023 -- 19:06 (UTC)',
  'Thu, Dec 21, 2023 -- 20:06 (UTC)',
  'Thu, Dec 21, 2023 -- 21:06 (UTC)',
  'Thu, Dec 21, 2023 -- 22:06 (UTC)',
  'Thu, Dec 21, 2023 -- 22:46 (UTC)',
  'Fri, Dec 22, 2023 -- 12:47 (UTC)',
  'Fri, Dec 22, 2023 -- 13:27 (UTC)',
  'Fri, Dec 22, 2023 -- 14:07 (UTC)',
  'Fri, Dec 22, 2023 -- 15:07 (UTC)',
  'Fri, Dec 22, 2023 -- 16:07 (UTC)',
  'Fri, Dec 22, 2023 -- 17:07 (UTC)',
  'Fri, Dec 22, 2023 -- 18:07 (UTC)',
  'Fri, Dec 22, 2023 -- 19:07 (UTC)',
  'Fri, Dec 22, 2023 -- 20:07 (UTC)',
  'Fri, Dec 22, 2023 -- 21:07 (UTC)',
  'Fri, Dec 22, 2023 -- 22:07 (UTC)',
  'Fri, Dec 22, 2023 -- 22:47 (UTC)',
  'Sat, Dec 23, 2023 -- 12:54 (UTC)',
  'Sat, Dec 23, 2023 -- 13:27 (UTC)',
  'Sat, Dec 23, 2023 -- 14:07 (UTC)',
  'Sat, Dec 23, 2023 -- 15:07 (UTC)',
  'Sat, Dec 23, 2023 -- 16:07 (UTC)',
  'Sat, Dec 23, 2023 -- 17:07 (UTC)',
  'Sat, Dec 23, 2023 -- 18:07 (UTC)',
  'Sat, Dec 23, 2023 -- 19:07 (UTC)',
  'Sat, Dec 23, 2023 -- 20:07 (UTC)',
  'Sat, Dec 23, 2023 -- 21:07 (UTC)',
  'Sat, Dec 23, 2023 -- 22:07 (UTC)',
  'Sat, Dec 23, 2023 -- 22:47 (UTC)',
  'Sun, Dec 24, 2023 -- 12:48 (UTC)',
  'Sun, Dec 24, 2023 -- 13:28 (UTC)',
  'Sun, Dec 24, 2023 -- 14:08 (UTC)',
  'Sun, Dec 24, 2023 -- 15:08 (UTC)',
  'Sun, Dec 24, 2023 -- 16:08 (UTC)',
  'Sun, Dec 24, 2023 -- 17:08 (UTC)',
  'Sun, Dec 24, 2023 -- 18:08 (UTC)',
  'Sun, Dec 24, 2023 -- 19:08 (UTC)',
  'Sun, Dec 24, 2023 -- 20:08 (UTC)',
  'Sun, Dec 24, 2023 -- 21:08 (UTC)',
  'Sun, Dec 24, 2023 -- 22:08 (UTC)',
  'Sun, Dec 24, 2023 -- 22:48 (UTC)',
  'Mon, Dec 25, 2023 -- 12:48 (UTC)',
  'Mon, Dec 25, 2023 -- 13:28 (UTC)',
  'Mon, Dec 25, 2023 -- 14:08 (UTC)',
  'Mon, Dec 25, 2023 -- 15:08 (UTC)',
  'Mon, Dec 25, 2023 -- 16:08 (UTC)',
  'Mon, Dec 25, 2023 -- 17:08 (UTC)',
  'Mon, Dec 25, 2023 -- 18:08 (UTC)',
  'Mon, Dec 25, 2023 -- 19:08 (UTC)',
  'Mon, Dec 25, 2023 -- 20:08 (UTC)',
  'Mon, Dec 25, 2023 -- 21:08 (UTC)',
  'Mon, Dec 25, 2023 -- 22:08 (UTC)',
  'Mon, Dec 25, 2023 -- 22:48 (UTC)',
  'Tue, Dec 26, 2023 -- 14:57 (UTC)',
  'Tue, Dec 26, 2023 -- 15:09 (UTC)',
  'Tue, Dec 26, 2023 -- 16:09 (UTC)',
  'Tue, Dec 26, 2023 -- 17:09 (UTC)',
  'Tue, Dec 26, 2023 -- 18:09 (UTC)',
  'Tue, Dec 26, 2023 -- 19:09 (UTC)',
  'Tue, Dec 26, 2023 -- 20:09 (UTC)',
  'Tue, Dec 26, 2023 -- 21:09 (UTC)',
  'Tue, Dec 26, 2023 -- 22:09 (UTC)',
  'Tue, Dec 26, 2023 -- 22:49 (UTC)',
  'Wed, Dec 27, 2023 -- 12:49 (UTC)',
  'Wed, Dec 27, 2023 -- 13:29 (UTC)',
  'Wed, Dec 27, 2023 -- 14:09 (UTC)',
  'Wed, Dec 27, 2023 -- 15:09 (UTC)',
  'Wed, Dec 27, 2023 -- 16:09 (UTC)',
  'Wed, Dec 27, 2023 -- 17:09 (UTC)',
  'Wed, Dec 27, 2023 -- 18:09 (UTC)',
  'Wed, Dec 27, 2023 -- 19:09 (UTC)',
  'Wed, Dec 27, 2023 -- 20:09 (UTC)',
  'Wed, Dec 27, 2023 -- 21:09 (UTC)',
  'Wed, Dec 27, 2023 -- 22:09 (UTC)',
  'Wed, Dec 27, 2023 -- 22:49 (UTC)',
  'Thu, Dec 28, 2023 -- 12:50 (UTC)',
  'Thu, Dec 28, 2023 -- 13:30 (UTC)',
  'Thu, Dec 28, 2023 -- 14:10 (UTC)',
  'Thu, Dec 28, 2023 -- 15:10 (UTC)',
  'Thu, Dec 28, 2023 -- 16:10 (UTC)',
  'Thu, Dec 28, 2023 -- 17:10 (UTC)',
  'Thu, Dec 28, 2023 -- 18:10 (UTC)',
  'Thu, Dec 28, 2023 -- 19:10 (UTC)',
  'Thu, Dec 28, 2023 -- 20:10 (UTC)',
  'Thu, Dec 28, 2023 -- 21:10 (UTC)',
  'Thu, Dec 28, 2023 -- 22:10 (UTC)',
  'Thu, Dec 28, 2023 -- 22:50 (UTC)',
  'Fri, Dec 29, 2023 -- 12:50 (UTC)',
  'Fri, Dec 29, 2023 -- 13:30 (UTC)',
  'Fri, Dec 29, 2023 -- 14:10 (UTC)',
  'Fri, Dec 29, 2023 -- 15:10 (UTC)',
  'Fri, Dec 29, 2023 -- 16:10 (UTC)',
  'Fri, Dec 29, 2023 -- 17:10 (UTC)',
  'Fri, Dec 29, 2023 -- 18:10 (UTC)',
  'Fri, Dec 29, 2023 -- 19:10 (UTC)',
  'Fri, Dec 29, 2023 -- 20:10 (UTC)',
  'Fri, Dec 29, 2023 -- 21:10 (UTC)',
  'Fri, Dec 29, 2023 -- 22:10 (UTC)',
  'Fri, Dec 29, 2023 -- 22:50 (UTC)',
  'Sat, Dec 30, 2023 -- 12:50 (UTC)',
  'Sat, Dec 30, 2023 -- 13:31 (UTC)',
  'Sat, Dec 30, 2023 -- 14:11 (UTC)',
  'Sat, Dec 30, 2023 -- 15:11 (UTC)',
  'Sat, Dec 30, 2023 -- 16:11 (UTC)',
  'Sat, Dec 30, 2023 -- 18:19 (UTC)',
  'Sat, Dec 30, 2023 -- 19:11 (UTC)',
  'Sat, Dec 30, 2023 -- 20:11 (UTC)',
  'Sat, Dec 30, 2023 -- 21:11 (UTC)',
  'Sat, Dec 30, 2023 -- 22:11 (UTC)',
  'Sat, Dec 30, 2023 -- 22:51 (UTC)',
];

export default defineComponent({
  data() {
    const showSplashScreen = new URLSearchParams(window.location.search).get("splash")?.toLowerCase() !== "false";
    const bounds = new L.LatLngBounds(
      new L.LatLng(17.025, -129.975),
      new L.LatLng(63.975, -54.475)
    );

    return {
      showSplashScreen,
      sheet: null as SheetType,
      layersLoaded: false,
      positionSet: false,
      
      accentColor: "#ffffff",
      buttonColor: "#ffffff",

      tab: 0,

      touchscreen: false,
      playInterval: null as Timeout | null,
      map: null as Map | null,
      basemap: null as L.TileLayer.WMS | null,
      bounds,
      texasBounds: new L.LatLngBounds(
        new L.LatLng(25.72, -108.23),
        new L.LatLng(36.69, -92.9)
      ),
      
      northeastBounds: new L.LatLngBounds(
        new L.LatLng(40.3, -74.5),
        new L.LatLng(43.5, -69.6)
      ),

      timestep: 0,
      timeIndex: 0,
      maxIndex: datetimes.length,
      timeValues: [...Array(datetimes.length).keys()],
      playing: false,
      imageOverlay: new L.ImageOverlay("", bounds, {
        opacity: 1,
        interactive: false,
      }),
      datetimes,

      searchOpen: true,
      searchErrorMessage: null as string | null,
    };
  },

  created() {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    this.touchscreen = ('ontouchstart' in window) || ('ontouchstart' in document.documentElement) || !!window.navigator.msPointerEnabled;
  },

  mounted() {
    this.map = L.map("map").setView([40, -50], 3, {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      crs: L.CRS.EPSG4326
    });
    this.addCoastlines();

    this.basemap = new L.TileLayer.WMS('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png', {
      crs: L.CRS.EPSG4326
    }).addTo(this.map as Map);
    this.map.fitBounds(this.bounds);

    const labelPane = this.map.createPane("labels");
    labelPane.style.zIndex = "650";
    labelPane.style.pointerEvents = "none";

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png', {
      attribution: 'OpenStreetMap, CartoDB',
      pane: 'labels'
    }).addTo(this.map as Map);

    this.imageOverlay.setUrl(this.imageUrl).addTo(this.map as Map);

  },

  computed: {

    /**
    Properties related to device/screen characteristics
    */
    smallSize(): boolean {
      return this.$vuetify.display.smAndDown;
    },
    mobile(): boolean {
      return this.smallSize && this.touchscreen;
    },

    /**
    This lets us inject component data into element CSS
    */
    cssVars() {
      return {
        '--accent-color': this.accentColor,
        '--app-content-height': this.showTextSheet ? '66%' : '100%',
      };
    },

    /**
    Computed flags that control whether the relevant dialogs display.
    The `sheet` data member stores which sheet is open, so these are just
    computed wrappers around modifying/querying that which can be used as
    dialog v-model values
    */
    showTextSheet: {
      get(): boolean {
        return this.sheet === 'text';
      },
      set(_value: boolean) {
        this.selectSheet('text');
      }
    },
    showVideoSheet: {
      get(): boolean {
        return this.sheet === "video";
      },
      set(value: boolean) {
        this.selectSheet('video');
        if (!value) {
          const video = document.querySelector("#info-video") as HTMLVideoElement;
          video.pause();
        }
      }
    },
    imageUrl(): string {
      return `https://tempo-demo-images.s3.amazonaws.com/img_${this.timeValues[this.timeIndex]}_cividis_stretch.png`;
    },
  },

  methods: {
    blurActiveElement() {
      const active = document.activeElement;
      if (active instanceof HTMLElement) {
        active.blur();
      }
    },

    closeSplashScreen() {
      this.showSplashScreen = false; 
    },

    selectSheet(name: SheetType) {
      if (this.sheet === name) {
        this.sheet = null;
        this.$nextTick(() => {
          this.blurActiveElement();
        });
      } else {
        this.sheet = name;
      }
    },
    addCoastlines() {
      fetch("coastlines.geojson")
        .then(response => response.json())
        .then(data => {
          L.geoJson(data, {
            style: { color: "black", weight: 1, opacity: 0.8 }
          }).addTo(this.map as Map);
        });
    },
    playOrPause() {
      if (this.playing && this.playInterval) {
        clearInterval(this.playInterval);
        this.playInterval = null;
      } else if (!this.playing) {
        this.playInterval = setInterval(() => {
          if (this.timeIndex >= this.maxIndex) {
            if (this.playInterval) {
              clearInterval(this.playInterval);
              this.playInterval = null;
            }
          } else {
            this.timeIndex += 1;
          }
        }, 200);
      }
      this.playing = !this.playing;
    },
    async geocodingInfoForSearch(searchText: string): Promise<MapBoxFeatureCollection | null> {
      return geocodingInfoForSearch(searchText, { countries: ["US", "CA", "MX", "CU", "BM", "HT", "DO"] }).catch(_err => null);
    }
  },

  watch: {
    imageUrl(url: string) {
      this.imageOverlay.setUrl(url);
    }
  }
});
</script>

<style lang="less">
@font-face {
  font-family: "Highway Gothic Narrow";
  src: url("./assets/HighwayGothicNarrow.ttf");
}

:root {
  --default-font-size: clamp(0.7rem, min(1.7vh, 1.7vw), 1.1rem);
  --default-line-height: clamp(1rem, min(2.2vh, 2.2vw), 1.6rem);
}

html {
  height: 100%;
  margin: 0;
  padding: 0;
  background-color: #000;
  overflow: hidden;

  
  -ms-overflow-style: none;
  // scrollbar-width: none;
}

body {
  position: fixed;
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden;

  font-family: Verdana, Arial, Helvetica, sans-serif;
}

#main-content {
  position: fixed;
  width: 100%;
  height: var(--app-content-height);
  overflow: hidden;

  transition: height 0.1s ease-in-out;
}

#app {
  width: 100%;
  height: 100%;
  margin: 0;
  overflow: hidden;
  font-size: 11pt;
}

#map {
  width: 100%;
  height: 600px;
}

#slider-row {
  display: flex;
  flex-direction: row;
}

#splash-overlay {
  position: fixed;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

#splash-screen {
  color: #FFFFFF;
  background-color: #000000;
  display: flex;
  flex-direction: column;
  flex-wrap: wrap;
  align-content: center;
  justify-content: space-around;

  font-family: 'Highway Gothic Narrow', 'Roboto', sans-serif;
  font-size: min(8vw, 7vh);

  border-radius: 10%;
  border: min(1.2vw, 0.9vh) solid var(--accent-color);
  overflow: auto;
  padding-top: 4rem;
  padding-bottom: 1rem;

  @media (max-width: 699px) {
    max-height: 80vh;
    max-width: 90vw;
  }

  @media (min-width: 700px) {
    max-height: 85vh;
    max-width: min(70vw, 800px);
  }

  div {
    margin-inline: auto;
    text-align: center;
  }

  .small {
    font-size: var(--default-font-size);
    font-weight: bold;
  }

  #close-splash-button {
    position: absolute;
    top: 0.5rem;
    right: 1.75rem;
    text-align: end;
    color: var(--accent-color);
    font-size: min(8vw, 5vh);

    &:hover {
      cursor: pointer;
    }
  }
}

.video-wrapper {
  height: 100%;
  background: black;
  text-align: center;
  z-index: 1000;

  #video-close-icon {
    position: absolute;
    top: 10px;
    right: 10px;
    z-index: 15;
    
    &:hover {
      cursor: pointer;
    }

    &:focus {
      color: white;
      border: 2px solid white;
    }
  }
}

video {
  height: 100%;
  width: auto;
  max-width: 100%;
  object-fit: contain;
}

#info-video {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  max-width: 100%;
  overflow: hidden;
  padding: 0px;
  z-index: 10;
}

.bottom-sheet {
  .v-overlay__content {
    align-self: flex-end;
    padding: 0;
    margin: 0;
    max-width: 100%;
    height: 34%;
  }

  #tabs {
    width: calc(100% - 3em);
    align-self: left;
  }
  
  .info-text {
    height: 33vh;
    padding-bottom: 25px;
  
    & a {
      text-decoration: none;
    }
  }
  
  .close-icon {
    position: absolute;
    top: 10px;
    right: 10px;
    z-index: 15;
  
    &:hover {
      cursor: pointer;
    }
  
    &:focus {
      color: white;
      border: 2px solid white;
    }
  }
  
  .scrollable {
    overflow-y: auto;
  }
  
  #tab-items {
    // padding-bottom: 2px !important;
  
    .v-card-text {
      font-size: ~"max(14px, calc(0.7em + 0.3vw))";
      padding-top: ~"max(2vw, 16px)";
      padding-left: ~"max(4vw, 16px)";
      padding-right: ~"max(4vw, 16px)";
  
      .end-spacer {
        height: 25px;
      }
    }
  
  }
  
  #close-text-icon {
    position: absolute;
    top: 0.25em;
    right: calc((3em - 0.6875em) / 3); // font-awesome-icons have width 0.6875em
    color: white;
  }

  // This prevents the tabs from having some extra space to the left when the screen is small
  // (around 400px or less)
  .v-tabs:not(.v-tabs--vertical).v-tabs--right>.v-slide-group--is-overflowing.v-tabs-bar--is-mobile:not(.v-slide-group--has-affixes) .v-slide-group__next, .v-tabs:not(.v-tabs--vertical):not(.v-tabs--right)>.v-slide-group--is-overflowing.v-tabs-bar--is-mobile:not(.v-slide-group--has-affixes) .v-slide-group__prev {
    display: none;
  }
}

.v-slider-thumb__surface::after {
  background-image: url("./assets/smithsonian.png");
  background-size: 20px 20px;
  height: 20px;
  width: 20px;
}

.v-slider-thumb__label {
  background-color: #ffd302;
  border: 3px solid #068ede;
  width: 210px;

  &::before {
    color: #068ede;
  }
}
</style>
