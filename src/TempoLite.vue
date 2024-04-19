<template>
<v-app
  id="app"
  :style="cssVars"
>
  <div
    id="main-content"
  >
    
    <div class="content-with-sidebars">
      <!-- tempo logo -->
      <img 
        src="./assets/TEMPO-Logo-Small.png"
        alt="TEMPO Logo"
        style="width: 100px; height: 100px;"
      >
      <h1 id="title">How much NO<sub>2</sub>&hellip;</h1>
      <div id="where" class="big-label">where</div>
      <div id="map-container">
        <div id="map"></div>
        <div id="map-legend"><hr class="line-legend">TEMPO Field of Regard</div>
        <colorbar 
          label="Amount of NO2"
          backgroundColor="transparent"
          :nsteps="10"
          :cmap="cividis"/>
      </div>
        <div id="when" class="big-label">when</div>
        <div id="slider-row">
          <icon-button
            v-if="false"
            :fa-icon="playing ? 'pause' : 'play'"
            @activate="playOrPause"
          ></icon-button>
            <v-slider
              v-model="timeIndex"
              :min="minIndex"
              :max="maxIndex"
              :step="1"
              color="#068ede95"
              thumb-label="always"
              :track-size="10"
              hide-details
            >
              <template v-slot:thumb-label>
                <div class="thumb-label">
                  {{ thumbLabel }}
                </div>
              </template>
          </v-slider>
        </div>


        <div id="timezone-select">
          <v-select
            v-model="selectedTimezone"
            label="Timezone"
            :items="timezoneOptions"
            item-title="name"
            item-value="tz"
          ></v-select>
        </div>

       <div id="user-options">
         <div>
           <!-- make a v-radio-group with 3 options -->
          <h2>Sample Scenarios</h2>
          <v-radio-group
            v-model="radio"
            row
          >
            <v-radio
              label="November 1, 2023"
              :value="0"
            ></v-radio>
            <v-radio
              label="November 3, 2023"
              :value="1"
            ></v-radio>
            <v-radio
              label="March 28, 2024"
              :value="2"
            ></v-radio>
          </v-radio-group>
        </div>

        <hr style="border-color: grey;">

        <div id="control-checkboxes">
          <v-checkbox
            v-model="showFieldOfRegard"
            @keyup.enter="showFieldOfRegard = !showFieldOfRegard"
            label="TEMPO Field of Regard"
            hide-details
            density="compact"
          />       
        </div>
      </div>
  
      <div id="information">
      <article>
        <h2>TEMPO Data</h2>
        <p>Some descriptive text about TEMPO and the data we are showing here.</p>
      </article>
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
import { getTimezoneOffset } from "date-fns-tz";

import { cividis } from "./cividis";
import fieldOfRegard from "./assets/TEMPO_FOR.json";
// We DO use MapBoxFeature in the template, but eslint isn't picking this up for some reason
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { MapBoxFeature, MapBoxFeatureCollection, geocodingInfoForSearch } from "./mapbox";

type SheetType = "text" | "video" | null;
type Timeout = ReturnType<typeof setTimeout>;

interface TimezoneInfo {
  tz: string;
  name: string;
}

const timestamps = [
  1698838920000,
  1698841320000,
  1698843720000,
  1698846120000,
  1698848520000,
  1698852120000,
  1698855720000,
  1698859320000,
  1698862920000,
  1698866520000,
  1698870120000,
  1698873720000,
  1698876120000,
  1698878520000,
  1698880920000,
  1699011720000,
  1699014120000,
  1699016520000,
  1699018920000,
  1699021320000,
  1699024920000,
  1699028520000,
  1699032120000,
  1699035720000,
  1699039320000,
  1699042920000,
  1699046520000,
  1699048920000,
  1699051320000,
  1699053720000,
  1711626180000,
  1711628640000,
  1711631040000,
  1711633440000,
  1711637040000,
  1711640640000,
  1711644240000,
  1711647840000,
  1711651440000,
  1711655040000,
  1711658640000,
  1711662240000,
  1711665840000,
  1711668240000,
];

export default defineComponent({
  data() {
    const showSplashScreen = new URLSearchParams(window.location.search).get("splash")?.toLowerCase() !== "false";
    const novDecBounds = new L.LatLngBounds(
      new L.LatLng(17.025, -154.975),
      new L.LatLng(63.975, -24.475)
    );

    const fieldOfRegardLayer = L.geoJSON(
      fieldOfRegard as GeoJSON.GeometryCollection,
      {
        style: {
          color: "red",
          fillColor: "transparent",
          weight: 1,
          opacity: 0.8,
        },
      }
    ) as L.Layer;

    return {
      showSplashScreen,
      sheet: null as SheetType,
      layersLoaded: false,
      positionSet: false,
      
      accentColor: "#ffffff",
      buttonColor: "#ffffff",

      radio: 0,

      touchscreen: false,
      playInterval: null as Timeout | null,
      map: null as Map | null,
      basemap: null as L.TileLayer.WMS | null,
      novDecBounds,
      marchBounds: new L.LatLngBounds(
        new L.LatLng(14.01, -167.99),
        new L.LatLng(72.99, -13.01)
      ),
      fieldOfRegardLayer,

      timezoneOptions: [
        { tz: 'US/Eastern', name: 'Eastern' },
        { tz: 'US/Central', name: 'Central' },
        { tz: 'US/Mountain', name: 'Mountain' },
        { tz: 'US/Pacific', name: 'Pacific' }
      ] as TimezoneInfo[],
      selectedTimezone: "US/Eastern",

      timestep: 0,
      timeIndex: 0,
      minIndex: 0,
      maxIndex: 14,
      timeValues: [...Array(timestamps.length).keys()],
      playing: false,
      imageOverlay: new L.ImageOverlay("", novDecBounds, {
        opacity: 1,
        interactive: false,
      }),
      timestamps,

      searchOpen: true,
      searchErrorMessage: null as string | null,

      showControls: true,
      showFieldOfRegard: true,
    };
  },

  created() {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    this.touchscreen = ('ontouchstart' in window) || ('ontouchstart' in document.documentElement) || !!window.navigator.msPointerEnabled;
  },

  mounted() {
    this.showSplashScreen = false;
    this.map = L.map("map").setView([40, -50], 3, {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      crs: L.CRS.EPSG4326
    });
    this.addCoastlines();

    this.basemap = new L.TileLayer.WMS('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png', {
      crs: L.CRS.EPSG4326
    }).addTo(this.map as Map);
    this.map.fitBounds(this.novDecBounds);

    const labelPane = this.map.createPane("labels");
    labelPane.style.zIndex = "650";
    labelPane.style.pointerEvents = "none";

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png', {
      attribution: 'OpenStreetMap, CartoDB',
      pane: 'labels'
    }).addTo(this.map as Map);

    this.imageOverlay.setUrl(this.imageUrl).addTo(this.map as Map);
    
    if (this.showFieldOfRegard) {
      this.fieldOfRegardLayer.addTo(this.map as Map);
    }
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
    timestamp(): number {
      return this.timestamps[this.timeIndex];
    },
    date() {
      return new Date(this.timestamp);
    },
    // TODO: Maybe there's a built-in Date function to get this formatting?
    thumbLabel(): string {
      const offset = getTimezoneOffset(this.selectedTimezone, this.date);
      const date = new Date(this.timestamp + offset); 
      const hours = date.getUTCHours();
      const amPm = hours >= 12 ? "PM" : "AM";
      let hourValue = hours % 12;
      if (hourValue === 0) {
        hourValue = 12;
      }
      return `${this.date.getUTCMonth()+1}/${date.getUTCDate()}/${date.getUTCFullYear()} ${hourValue}:${date.getUTCMinutes().toString().padStart(2, '0')} ${amPm}`;
    },
    imageUrl(): string {
      return `https://tempo-demo-images.s3.amazonaws.com/tempo_${this.date.getUTCFullYear()}-${(this.date.getUTCMonth()+1).toString().padStart(2, '0')}-${this.date.getUTCDate().toString().padStart(2, '0')}T${this.date.getUTCHours()}h${this.date.getUTCMinutes().toString().padStart(2, '0')}m.png`;
    },
  },

  methods: {
    
    cividis(x: number): string {
      return cividis(x);
    },
    
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
    },

    showFieldOfRegard (show: boolean) {
      if (show) {
        this.fieldOfRegardLayer.addTo(this.map as Map);
      } else if (this.map) {
        this.map.removeLayer(this.fieldOfRegardLayer as L.Layer);
      }
    },
    radio(value: number) {
      const minIndex = 15 * value;
      this.minIndex = minIndex;
      this.maxIndex = Math.min(15 * (value + 1) - 1, this.timestamps.length - 1);
      this.timeIndex = minIndex;
      const bounds = value < 2 ? this.novDecBounds : this.marchBounds;
      this.map?.fitBounds(bounds);
      this.imageOverlay.setBounds(bounds);
    },
  }
});
</script>

<style lang="less">
@font-face {
  font-family: "Highway Gothic Narrow";
  src: url("./assets/HighwayGothicNarrow.ttf");
}

// import Lexand from google fonts
@import url('https://fonts.googleapis.com/css2?family=Lexend:wght@100..900&display=swap');

:root {
  --default-font-size: clamp(0.7rem, min(1.7vh, 1.7vw), 1.1rem);
  --default-line-height: clamp(1rem, min(2.2vh, 2.2vw), 1.6rem);
  --smithsonian-blue: #009ade;
  --smithsonian-yellow: #ffcc33;
  --info-background: #092088;
  --map-height: 500px;
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
  height: var(--map-height)
}

// define the layout
.content-with-sidebars {
  position: relative;
  padding: 0;
  
  display: grid;
  grid-template-columns: .08fr .8fr .3fr;
  grid-template-rows: 50px auto auto auto;
  gap: 20px 10px;
  
  > * {
    background-color: transparent;
  }
  
  > div {
    outline: 1px solid transparent;
  }
  
  #user-options {
    margin-left: 1rem;
    grid-column: 3 / 4;
    grid-row: 2 / 3;
  }
  
  #title {
    grid-column: 2 / 3;
    grid-row: 1 / 2;
  }
  
  #where {
    grid-column: 1 / 2;
    grid-row: 2 / 3;
  }
  
  #map-container {
    grid-column: 2 / 3;
    grid-row: 2 / 3;
  }
  
  #when {
    grid-column: 1 / 2;
    grid-row: 3 / 4;
  }
  
  #slider-row {
    grid-column: 2 / 3;
    grid-row: 3 / 4;
  }

  #timezone-select {
    grid-column: 3 / 4;
    grid-row: 3 / 4;
  }
  
  #information {
    grid-column: 2 / 4;
    grid-row: 4 / 5;
  }
  
  
}

//  style the content 
#main-content {
  padding: 2rem;
}

.content-with-sidebars {
  font-family: "Lexend", sans-serif;
  font-optical-sizing: auto;
  font-weight: normal;
  font-style: normal;
  background-color: transparent;
}

#title {
  color: var(--smithsonian-yellow);
  font-weight: 600;
  font-size: 40px;
  text-align: left;
  text-wrap: nowrap;
}

#information {
  background-color: var(--info-background);
  border-radius: 10px;
  padding: 1rem;
  margin-top: 1rem;
}


.big-label {
  font-size: 40px;
  text-align: right;
  align-self: end;
  color: var(--smithsonian-blue);
}

#when {
  align-self: start;
}

#map-container {
  position: relative;
  display: flex;
  flex-direction: row;

  > #map {
    flex-basis: 80%;
    flex-grow: 1;
    flex-shrink: 1;
  }
  
  > #map-legend {
    position: absolute;
    bottom: 0;
    left: 0;
    width: fit-content;
    z-index: 1000;
    
    display: flex;
    align-items: center;
    gap: 0.5rem;
    
    color: black;
    background-color: #fff5;
    padding-left: 0.5rem;
    padding-right: 0.25rem;
    
    hr.line-legend {
      display: inline-block;
      border: 0.5px solid red;
      width: 3rem;
    }
    

  }

  > .colorbar-container {
    flex-grow: 0;
    flex-shrink: 1;
    
    .colorbar-label {
      transform: rotate(180deg) translate(-110%,-50%)
    }
  }
}

#slider-row {
  display: flex;
  flex-direction: row;
  padding-left: 1rem;
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
  background-size: 30px 30px;
  height: 30px;
  width: 30px;
}

.v-slider-thumb__label {
  background-color: #ffd302;
  border: 0.25rem solid #068ede;
  width: max-content;
  height: 2.5rem;
  font-size: 1rem;


  &::before {
    color: #068ede;
  }
}

.v-slider.v-input--horizontal {
  grid-template-rows: auto 0px;
}

.v-slider.v-input--horizontal .v-slider-thumb__label {
  top: calc(var(--v-slider-thumb-size) * 1.5);
}

.v-slider.v-input--horizontal .v-slider-thumb__label::before {
    border-left: 6px solid transparent;
    border-right: 6px solid transparent;
    border-top: 6px solid transparent;
    border-bottom: 6px solid currentColor;
    top: -15px;
}

#control-checkboxes {
  margin-top: 1em;
}
</style>
