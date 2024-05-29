<template>
<v-app
  id="app"
  :style="cssVars"
>
<v-overlay
  :model-value="inIntro"
  :style="cssVars"
  id="intro-background"
>

<v-dialog 
  v-model="inIntro"
        >
        <div v-if="inIntro" id="introduction-overlay" class="elevation-10 gradient-background">
          <v-window v-model="introSlide">
            <template v-slot:additional>
              <div id="intro-window-close-button">
              <font-awesome-icon
                size="xl"
                class="ma-1"
                color="#b3d5e6"
                icon='square-xmark'
                @click="inIntro = !inIntro"
                @keyup.enter="inIntro = !inIntro"
                tabindex="0"
                tooltip-location="start"
              /> 
            </div>
            </template>
            <v-window-item :value="1">
              <div class="intro-text">
                <p class="mb-5">
                  The TEMPO satellite mission (Tropospheric Emissions: Monitoring Pollution), launched in April 2023, is the first space-based instrument to monitor major air pollutants across the North American continent every daylight hour at high spatial resolution. A collaboration between NASA and the Smithsonian Astrophysical Observatory, the TEMPO instrument gathers hourly daytime scans of the atmosphere over North America from the Atlantic Ocean to the Pacific Coast and from roughly Mexico City to central Canada.
                </p>
              </div>
            </v-window-item>
            
            <v-window-item :value="2">
              <div class="intro-text mb-3">
                <p class="mb-3">
                  This Data Story provides an introduction to what can be learned from TEMPO’s data, which became publicly available May 20, 2024. The map here visualizes hourly Nitrogen Dioxide (NO<sub>2</sub>) data from several different dates. NO<sub>2</sub> is produced by:
                </p> 
                <ul>
                  <li>burning of fossil fuels&#8212;for example from vehicles, power plants, manufacturing sites, oil refineries</li>
                  <li>wildfires</li>
                  <li>agricultural use of nitrogen-based fertilizers (which are broken down into NO<sub>2</sub> by microbes in soil)</li>
                </ul>
                <p class="mt-3">
                For each date, you can see the scans beginning on the East Coast in the morning, and ending on the West Coast as the Sun sets.
                </p> 
              </div>
            </v-window-item>
            <v-window-item :value="3">
              <div class="intro-text mb-3">      
                <p class="mb-3">
                  In this interactive page you can:
                </p>
                <ul>
                  <li>
                    Select a date and press the “Play” button or scroll the time slider to view the changing concentrations of NO<sub>2</sub> over North America on those dates. 
                  </li>
                  <li>
                    Press the “Info” button next to each Featured Date to get an overview of what to look for on that date
                  </li>
                  <li>
                    For each date, select one of two zoomed-in Locations to investigate specific pollution events.
                  </li>
                  <li>
                    You can use the “Timezone” setting to investigate how pollution evolves over the day, for example as rush hour progresses in large cities.
                  </li>
                </ul>
                <!-- add do not show introduction again button -->
                <v-checkbox
                  v-model="dontShowIntro"
                  @keyup.enter="dontShowIntro = !dontShowIntro"
                  label="Don't show this introduction again"
                  color="#c10124"
                  hide-details
                />
              </div>
            </v-window-item>
          </v-window>

          <div id="intro-bottom-controls">
            <div>
              <v-btn
                v-if="(introSlide > 1)"
                id="intro-next-button"
                :color="accentColor"
                @click="introSlide--"
                @keyup.enter="introSlide--"
                elevation="0"
                >
                Back
              </v-btn>
            </div>
            
            <v-btn
              id="intro-next-button"
              :color="accentColor"
              @click="introSlide++"
              @keyup.enter="introSlide++"
              elevation="0"
              >
              {{ introSlide < 3 ? 'Next' : 'Get Started' }}
            </v-btn>
          </div>
        </div>
      </v-dialog>
    </v-overlay>
  <div
    id="main-content"
  > 
    <div class="content-with-sidebars">
      <!-- tempo logo -->
      <a href="https://tempo.si.edu" target="_blank" rel="noopener noreferrer" >
        <img 
          src="./assets/TEMPO-Logo-Small.png"
          alt="TEMPO Logo"
          style="width: 100px; height: 100px;"
        >
      </a>

      <h1 id="title">What is in the Air You Breathe?</h1>
      <div id="where" class="big-label">where</div>
      <div
        id="opacity-slider-container"
      >
        <v-slider
          v-model="opacity"
          :min="0"
          :max="1"
          color="red"
          direction="vertical"
        >
          <template v-slot:thumb-label>
            <span class="mdi mdi-opacity"></span>
          </template>
        </v-slider>
      </div>
      <div id="map-container">
        <div id="map"></div>
        <div v-if="showFieldOfRegard" id="map-legend"><hr class="line-legend">TEMPO Field of Regard</div>
        <colorbar 
          label="Amount of NO2"
          backgroundColor="transparent"
          :nsteps="255"
          :cmap="cbarNO2"
          start-value="1"
          end-value="150"
          :extend="true"
        >
          <template v-slot:label>
              <div style="text-align: center;">Amount of NO&#x2082;<br><span class="unit-label">(10&sup1;&#x2074; molecules/cm&sup2;)</span></div>
          </template>
        </colorbar>
        <location-search
          v-model="searchOpen"
          small
          stay-open
          buttonSize="xl"
          persist-selected
          :search-provider="geocodingInfoForSearch"
          @set-location="(feature: MapBoxFeature) => {
            if (feature !== null) {
              map?.setView([feature.center[1], feature.center[0]], 6);
            }
          }"
          @error="(error: string) => searchErrorMessage = error"
        ></location-search>

      </div>
        <div id="when" class="big-label">when</div>
        <div id="slider-row">
          <v-slider
            class="time-slider"
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
          <icon-button
            id="play-pause"
            :fa-icon="playing ? 'pause' : 'play'"
            fa-size="sm"
            @activate="playing = !playing"
          ></icon-button>
        </div>

        <div id="bottom-options">
          <br>
          <v-select
            v-model="selectedTimezone"
            label="Timezone"
            :items="timezoneOptions"
            item-title="name"
            item-value="tz"
          ></v-select>
          <div id="control-checkboxes">
            <v-checkbox
              v-model="showFieldOfRegard"
              @keyup.enter="showFieldOfRegard = !showFieldOfRegard"
              label="TEMPO Field of Regard"
              color="#c10124"
              hide-details
            />       
          </div>
                  <!-- add text box that allows manually setting the custom image url -->
          <!-- <v-text-field
            v-model="customImageUrl"
            label="Custom Image URL"
            hide-details
          ></v-text-field> -->

          
        </div>

       <div id="user-options">
        <!-- {{ whichDataSet }} Data -->
        <div id="all-dates">
          <h2>Date Picker</h2>  
          <div class="d-flex flex-row align-center">
            <v-radio-group v-model="radio">
              <v-radio
                label="All Available Dates"
                :value="0"
              ></v-radio>
            </v-radio-group>
          </div>        
          <!-- create a list of the uniqueDays -->
          <v-select
            :items="uniqueDays"
            item-title="title"
            item-value="value"
            label="Select a Date"
            @update:model-value="(e) => {radio = undefined; setNearestDate(e);}"
            hide-details
          ></v-select>
        </div>


         <div id="date-radio">
           <!-- make a v-radio-group with 3 options -->
          <h2>Featured Dates</h2>
          <v-radio-group
            v-model="radio"
            row
          >
            <div class="d-flex flex-row align-center">
              <v-radio
                label="November 1, 2023"
                :value="1"
              >
              </v-radio>
              <info-button>
                <p>
                  Because the TEMPO instrument measures sunlight reflected and scattered from Earth’s 
                surface and atmosphere, it can’t “see” through the clouds&mdash;so these
                areas appear blank on the map.
                </p>
                <p>
                  But right away you’ll see that there 
                are high concentrations of NO<sub>2</sub> around many urban centers, 
                and sometimes along major highways.
                </p>
              </info-button>
            </div>
            <div class="d-flex flex-row align-center">
              <v-radio
                label="November 3, 2023"
                :value="2"
              ></v-radio>
              <info-button>
                Levels of NO<sub>2</sub> change quickly from day to day, 
                and even from hour to hour as wind transports 
                plumes of pollution.
              </info-button>
            </div>
            <div class="d-flex flex-row align-center">
              <v-radio
                label="March 28, 2024"
                :value="3"
              ></v-radio>
              <info-button>
                Breathing air with a high concentration of NO<sub>2</sub>, 
                and the resulting smog it forms when it reacts with other pollutants, 
                can irritate human respiratory systems. 
                People with asthma, as well as children and the elderly, 
                are generally at greater risk for the health effects of air pollution. 
                TEMPO data can help communities make informed 
                decisions and take action to improve air quality.
              </info-button>
            </div>
          </v-radio-group>
        </div>

        <hr style="border-color: grey;"  v-if="radio>0">
        
        <div id="locations-of-interest" v-if="radio>0">
          <h3 class="mb-1">Locations for {{ dateStrings[radio] }}</h3>
          <v-radio-group
            v-if="radio !== undefined"
            v-model="sublocationRadio"
            row
          >
          <div
            v-for="(loi, index) in locationsOfInterest[radio]" 
            v-bind:key="index" 
            class="sublocation-radio-wrapper d-flex flex-row align-center space-between">
            <v-radio
              class="sublocation-radio"
              :label="loi.text"
              :value="index"
            ></v-radio>
            <info-button>
              <p v-html="locationsOfInterestText[radio][index]"></p>
            </info-button>
          </div>
          </v-radio-group>
        </div>

        <hr style="border-color: grey;">

      </div>
  
      <div id="information">
      <article>
        <h2>TEMPO NO<sub>2</sub> Data</h2>
        <p>
          <a href="https://tempo.si.edu" target="_blank" rel="noopener noreferrer" >
          TEMPO</a>, a collaboration between the Smithsonian and NASA, is the first space-based probe to measure air pollution hourly over North America at neighborhood scales. NO<sub>2</sub> (nitrogen dioxide) is one of the pollutants detected by TEMPO. It is produced by wildfires and the burning of fossil fuels. NO<sub>2</sub> contributes to the formation of harmful ground-level ozone and toxic particulates in the air we breathe.
        </p>

          <div class="d-flex flex-row justify-space-between">
          <a>
            Credits
            <v-dialog
              id="credits-dialog"
              v-model="showCredits"
              activator="parent"
              :scrim="false"
              location="center center"
            >
              <v-card class="dialog-card">
                <font-awesome-icon
                    style="position:absolute;right:16px;cursor:pointer;padding:0.5em;margin:-0.5em"
                    icon="square-xmark"
                    size="xl"
                    @click="showCredits = false"
                    @keyup.enter="showCredits = false"
                    :color="accentColor2"
                    tabindex="0"
                  ></font-awesome-icon>
                <v-card-title tabindex="0"><h3>Credits</h3></v-card-title>
                <v-card-text>
                  <h4 class="mb-2"><a href="https://tempo.si.edu/" target="_blank" rel="noopener noreferrer">TEMPO</a> Team Acknowledgments:</h4>
                  <p>
                    Caroline Nowlan, Aaron Naeger, and Erika Wright provided dates and locations for events of interest in the TEMPO data.
                  </p>
                  <p>
                    Xiong Liu provided the L3 version 2 TEMPO data files.
                  </p>
                  <p>
                    Heesung Chong provided the shape file for the TEMPO field of regard.
                  </p>

                  <p class="my-3">NASA's Scientific Visualization Studio provided the TEMPO NO<sub>2</sub> colormap.</p>

                  <h4 class="mb-2"><a href="https://www.cosmicds.cfa.harvard.edu/" target="_blank" rel="noopener noreferrer">CosmicDS</a> Team:</h4> 

                  Jonathan Foster<br>
                  Jon Carifio<br>
                  John Lewis<br>
                  Pat Udomprasert<br>
                  Alyssa Goodman<br>
                  Erika Wright<br>
                  Mary Dussault<br>
                  Harry Houghton<br>
                  Evaluator: Sue Sunbury<br>

                  <funding-acknowledgment class="my-3"></funding-acknowledgment>
                </v-card-text>
              </v-card>
            </v-dialog>
          </a>
          <!-- make small inline show introduction link button -->
          <a href="#" @click="inIntro = true" @keyup.enter="inIntro = true" style="right: 0;">
            Show Introduction
          </a>
        </div>

      </article>
      </div>
      <div id="body-logos">
        <a href="https://www.si.edu/" target="_blank" rel="noopener noreferrer" class="mr-1" 
        ><img alt="Smithsonian Logo" src="./assets/smithsonian.png"
         /></a>
        <credit-logos/>
      </div>
    </div>
  </div>
</v-app>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import L, { Map } from "leaflet";
import "leaflet.zoomhome";
import { getTimezoneOffset } from "date-fns-tz";
import  { cividis } from "./cividis";
import  { svs } from "./svs_cmap";
import { cbarNO2, cbarNO2ColorsRevised2023 } from "./revised_cmap";
import fieldOfRegard from "./assets/TEMPO_FOR.json";
import augustFieldOfRegard from "./assets/august_for.json";
// We DO use MapBoxFeature in the template, but eslint isn't picking this up for some reason
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { MapBoxFeature, MapBoxFeatureCollection, geocodingInfoForSearch } from "./mapbox";


type SheetType = "text" | "video" | null;
type Timeout = ReturnType<typeof setTimeout>;

interface TimezoneInfo {
  tz: string;
  name: string;
}

import { erdTimestamps, newTimestamps } from "./timestamps";

const fosterTimestamps = [
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

// combine the timestamps from the two sources
const timestamps = erdTimestamps.concat(fosterTimestamps).concat(newTimestamps);
// sort the timestamps
timestamps.sort();


interface LocationOfInterest {
  latlng: L.LatLngExpression;
  zoom: number;
  text: string;
  index: number;
}

const WINDOW_DONTSHOWINTRO = window.localStorage.getItem("dontShowIntro") === 'true';

export default defineComponent({
  data() {
    const showSplashScreen = new URLSearchParams(window.location.search).get("splash")?.toLowerCase() !== "false";
    const novDecBounds = new L.LatLngBounds(
      new L.LatLng(17.025, -154.975),
      new L.LatLng(63.975, -24.475)
    );
    
    const marchBounds = new L.LatLngBounds(
      new L.LatLng(14.01, -167.99),
      new L.LatLng(72.99, -13.01)
    );

    const fieldOfRegardLayer = L.geoJSON(
      fieldOfRegard as GeoJSON.GeometryCollection,
      {
        style: {
          color: "#c10124",
          fillColor: "transparent",
          weight: 1,
          opacity: 0.8,
        },
      }
    ) as L.Layer;
      
    const datesOfInterest = [
      null,
      new Date(2023, 10, 1), // Nov 1
      new Date(2023, 10, 3), // Nov 3
      new Date(2024, 2, 28), // Mar 28
    ];

    const dateStrings = {
      1: 'Nov 1',
      2: 'Nov 3',
      3: 'Mar 28'
    };

    const locationsOfInterest = [
      null,
      [{ latlng: [34.359786, -111.700124], zoom:7, text: "Arizona Urban Traffic and Fires", index: timestamps.indexOf(1698848520000)}, { latlng: [36.1716, -115.1391], zoom:7, text: "Las Vegas: Fairly Constant Levels All Day", index: timestamps.indexOf(1698848520000)}],  // Nov 1
      [{ latlng: [36.215934, -119.777500], zoom:6, text: "California Traffic and Agriculture", index: timestamps.indexOf(1699021320000)}, { latlng: [41.857260, -80.531177], zoom:5, text: "Northeast: Large Emissions Plumes", index: timestamps.indexOf(1699014120000)}],  // Nov 3
      [{ latlng: [31.938392, -99.095785], zoom:6, text: "Texas Oil and Gas Production", index: timestamps.indexOf(1711631040000)}, { latlng: [31.331933, -91.575283], zoom: 8, text: "LA/MS Fires", index: timestamps.indexOf(1711644240000)}],  // Mar 28
    ] as LocationOfInterest[][];
    
    const locationsOfInterestText = [
      ['',''],
      [
        '<p>NO<sub>2</sub> increases during daily rush hour. In Phoenix, notice the high levels of NO<sub>2</sub> early in the morning, dip down during the day, then start to build back up during the evening commute.</p><p>Fires can be seen between Phoenix and Flagstaff. These are most easily identified as hot spots of NO<sub>2</sub> that appear quickly. As the smoke from the fires builds up, it becomes so thick that it becomes difficult for the TEMPO instrument to &lsquo;see through.&rsquo; </p>', 
        '<p>In this data Las Vegas has less daily variation than many other cities.</p>'
      ],  // Nov 1
      [
        '<p>Los Angeles clearly stands out. NO<sub>2</sub> values are even higher than the maximum of our color bar. You can clearly see the highways including Route 10 between San Bernardino and Mexicali and Route 15 leading from San Bernardino towards Las Vegas. A significant amount of NO<sub>2</sub> in California&rsquo;s central valley is a byproduct of agricultural activity there. Excess fertilizer in the soil gets broken down by microbes to produce nitrogen oxides which are very reactive. Emissions that don&rsquo;t come from combustion are typically much harder to see, but the Central Valley is an area where TEMPO data may reveal this agricultural source of pollution.</p>',
        '<p>Air pollution is often transported, or moved, over great distances. In this data set large plumes can be seen over the Northeast. If you look closely you can see that many of these plumes appear to originate out of cities in the midwest including Nashville, St. Louis, and Memphis.</p>'
      ],  // Nov 3
      [
        '<p>The Permian basin, near Odessa, has two large plumes of NO2. This is the largest oil and gas producing area in the USA. You can also see here how pollution from a source in one state (Texas) can be transported across state lines to New Mexico.</p>',
        '<p>Two fires can be seen popping up south and east of Alexandria. These are most easily identified as hot spots of NO2 that appear quickly. As the smoke from the fires build up it becomes so thick that it becomes difficult for the TEMPO instrument to &lsquo;see through.&rsquo;</p>'
      ],  // Mar 28
    ];

    const opacity = 0.7;
    return {
      showSplashScreen,
      sheet: null as SheetType,
      layersLoaded: false,
      positionSet: false,
      
      accentColor: "#068ede",
      accentColor2: "#ffd302",
      buttonColor: "#ffffff",
      introSlide: 1,
      

      inIntro: !WINDOW_DONTSHOWINTRO,
      dontShowIntro: WINDOW_DONTSHOWINTRO,

      radio: 0 as number | undefined,
      sublocationRadio: null as number | null,

      touchscreen: false,
      playInterval: null as Timeout | null,
      map: null as Map | null,
      basemap: null as L.TileLayer.WMS | null,
      novDecBounds,
      marchBounds: new L.LatLngBounds(
        new L.LatLng(14.01, -167.99),
        new L.LatLng(72.99, -13.01)
      ),
      bounds: marchBounds.toBBoxString().split(",").map(parseFloat),
      fieldOfRegardLayer,
      locationsOfInterest,
      locationsOfInterestText,
      datesOfInterest,
      dateStrings,

      customImageUrl: "",

      timezoneOptions: [
        { tz: 'US/Eastern', name: 'Eastern Daylight' },
        { tz: 'US/Central', name: 'Central Daylight' },
        { tz: 'US/Mountain', name: 'Mountain Daylight' },
        { tz: 'US/Arizona', name: 'Mountain Standard' },
        { tz: 'US/Pacific', name: 'Pacific Daylight' },
        { tz: 'US/Alaska', name: 'Alaska Daylight' },
        { tz: 'UTC', name: 'UTC' },
      ] as TimezoneInfo[],
      selectedTimezone: "US/Eastern",

      timestep: 0,
      timeIndex: 0,
      minIndex: 0,
      maxIndex: timestamps.length - 1,
      timeValues: [...Array(timestamps.length).keys()],
      playing: false,
      imageOverlay: new L.ImageOverlay("", novDecBounds, {
        opacity,
        interactive: false,
      }),
      opacity,
      timestamps,
      erdTimestamps,
      newTimestamps,
      fosterTimestamps,

      searchOpen: true,
      searchErrorMessage: null as string | null,

      showControls: true,
      showFieldOfRegard: true,
      showCredits: false,
    };
  },

  created() {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    this.touchscreen = ('ontouchstart' in window) || ('ontouchstart' in document.documentElement) || !!window.navigator.msPointerEnabled;
  },

  mounted() {
    this.showSplashScreen = false;
    this.map = L.map("map", { zoomControl: false }).setView([40.044, -98.789], 4, {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      crs: L.CRS.EPSG4326
    });
    console.log(this.map);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const zoomHome = L.Control.zoomHome();
    const originalZH = zoomHome._zoomHome.bind(zoomHome);
    zoomHome._zoomHome = (_e: Event) => {
      originalZH();
      this.sublocationRadio = null;
    };
    zoomHome.addTo(this.map);
    this.addCoastlines();

    this.basemap = new L.TileLayer.WMS('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png', {
      crs: L.CRS.EPSG4326
    }).addTo(this.map as Map);

    const labelPane = this.map.createPane("labels");
    labelPane.style.zIndex = "650";
    labelPane.style.pointerEvents = "none";

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png', {
      attribution: 'OpenStreetMap, CartoDB',
      pane: 'labels'
    }).addTo(this.map as Map);

    this.imageOverlay.setUrl(this.imageUrl).addTo(this.map as Map);
    
    this.updateFieldOfRegard();
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
        '--accent-color-2': this.accentColor2,
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
    
    imageName(): string {
      const fname = `tempo_${this.date.getUTCFullYear()}-${(this.date.getUTCMonth()+1).toString().padStart(2, '0')}-${this.date.getUTCDate().toString().padStart(2, '0')}T${this.date.getUTCHours()}h${this.date.getUTCMinutes().toString().padStart(2, '0')}m.png`;
      return fname;
    },
    
    imageUrl(): string {
      if (this.customImageUrl) {
        return this.customImageUrl;
      }
      let url = '';
      if (this.fosterTimestamps.includes(this.timestamp)) {
        url = 'https://tempo-images-bucket.s3.amazonaws.com/tempo-lite/';
      }
      
      if (this.erdTimestamps.includes(this.timestamp)) {
        // url = 'https://tempo-images-bucket.s3.amazonaws.com/early_release_v01/';
        url = "https://johnarban.github.io/wwt_interactives/images/tempo-data/erd/";
      }
      
      if (this.newTimestamps.includes(this.timestamp)) {
        // url = 'https://tempo-images-bucket.s3.amazonaws.com/level3_version3/';
        url = "https://johnarban.github.io/wwt_interactives/images/tempo-data/new/";
      }
    
      return url + this.imageName;
    },
    
    whichDataSet(): string {
      if (this.fosterTimestamps.includes(this.timestamp)) {
        return 'TEMPO-lite';
      }
      
      if (this.erdTimestamps.includes(this.timestamp)) {
        return 'Early Release (V01)';
      }
      
      if (this.newTimestamps.includes(this.timestamp)) {
        return 'Level 3 (V03)';
      }
      
      return 'Unknown';
    },
    
    newBounds() {
      return new L.LatLngBounds(
        new L.LatLng(this.bounds[1], this.bounds[0]),
        new L.LatLng(this.bounds[3], this.bounds[2])
      );
    },
    
    imageBounds() {
      // currently the 2023 data is all V01
      if (this.date.getUTCFullYear() === 2023) {
        return this.novDecBounds;
      } else if (this.date.getUTCFullYear() === 2024 && this.date.getUTCMonth() === 2) {
        return this.marchBounds;
      } else {
        return this.newBounds;
      }
    },
    
    uniqueDays() {
      // eastern time
      const offset = (date: Date) => getTimezoneOffset("US/Eastern", date);
      const easternDates = this.timestamps.map(ts => new Date(ts + offset(new Date(ts))));
      const days = easternDates.map(date => new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())).map(date => date.getTime());
      const unique =  Array.from(new Set(days));
      const stamps = unique.map(day => new Date(day)).map(date => date.toDateString());
      // create an object with keys for timestamp and value
      return stamps.map((stamp, index) => ({ value: unique[index], title: stamp }));
    }
    
  },

  methods: {
    
    cividis(x: number): string {
      return cividis(x);
    },
    
    svs(x: number): string {
      return svs(x);
    },
    
    cbarNO2(x: number): string {
      const rgb = cbarNO2(0, 1, x);
      return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]},1)`;
    },
    
    cbarNO2ColorsRevised2023(x: number): string {
      const rgb = cbarNO2ColorsRevised2023(0, 1, x);
      return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]},1)`;
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
    async geocodingInfoForSearch(searchText: string): Promise<MapBoxFeatureCollection | null> {
      return geocodingInfoForSearch(searchText, { countries: ["US", "CA", "MX", "CU", "BM", "HT", "DO"] }).catch(_err => null);
    },
    resetMapBounds() {
      this.map?.setView([40.044, -98.789], 4);
    },
    play() {
      this.playInterval = setInterval(() => {
        if (this.timeIndex >= this.maxIndex) {
          if (this.playInterval) {
            // clearInterval(this.playInterval);
            // this.playInterval = null;
            // let it loop
            this.timeIndex = this.minIndex;
          }
        } else {
          this.timeIndex += 1;
        }
      }, 250);
    },
    pause() {
      if (this.playInterval) {
        clearInterval(this.playInterval);
      }
    },
    updateBounds() {
      this.imageOverlay.setBounds(this.imageBounds);
    },
    
    setNearestDate(date: number | null) {
      if (date == null) {
        return;
      }
      const onedayinms = 1000 * 60 * 60 * 24;
      const mod = this.timestamps.filter(ts => ((ts - date) < onedayinms) && (ts - date) > 0);
      // set minIndex and maxIndex to the first and last index of the mod array
      this.minIndex = this.timestamps.indexOf(mod[0]);
      this.maxIndex = this.timestamps.indexOf(mod[mod.length - 1]);
      this.timeIndex = this.minIndex;
    },
    
    updateFieldOfRegard() {
      console.log('updateFieldOfRegarg');
      if (this.date.getUTCFullYear() === 2023 && this.date.getUTCMonth() === 7) {
        console.log('august');
        (this.fieldOfRegardLayer as L.GeoJSON).clearLayers();
        (this.fieldOfRegardLayer as L.GeoJSON).addData(augustFieldOfRegard as GeoJSON.GeometryCollection);
      } else {
        (this.fieldOfRegardLayer as L.GeoJSON).clearLayers();
        (this.fieldOfRegardLayer as L.GeoJSON).addData(fieldOfRegard as GeoJSON.GeometryCollection);
      }
    }
    
  },

  watch: {

    introSlide(val: number) {
      this.inIntro = val < 4;
      return;
    },
    
    dontShowIntro(val: boolean) {
      window.localStorage.setItem("dontShowIntro", val.toString());
      if (!val) {
        this.inIntro = true;
      }
    },
    

    playing(play: boolean) {
      if (play) {
        this.play();
      } else {
        this.pause();
      }
    },
    imageUrl(url: string) {
      this.updateBounds();
      this.imageOverlay.setUrl(url);
      this.updateFieldOfRegard();
    },
    
    imageBounds(bounds: L.LatLngBounds) {
      console.log(this.whichDataSet, bounds.toBBoxString());
    },
    
    showFieldOfRegard (show: boolean) {
      if (show) {
        this.fieldOfRegardLayer.addTo(this.map as Map);
      } else if (this.map) {
        this.map.removeLayer(this.fieldOfRegardLayer as L.Layer);
      }
    },
    
    radio(value: number) {
      if (value === undefined) {
        return;
      }
      if (value == 0) {
        this.minIndex = 0;
        this.maxIndex = this.timestamps.length - 1;
        this.sublocationRadio = null;
        return;
      }
      this.setNearestDate(this.datesOfInterest[value]?.getTime() ?? null);
      this.sublocationRadio = null;
    },
    
    sublocationRadio(value: number | null) {
      if (value !== null && this.radio !== undefined) {
        const loi = this.locationsOfInterest[this.radio][value];
        this.map?.setView(loi.latlng, loi.zoom);
        this.timeIndex = loi.index;
      }
    },

    opacity(value: number) {
      this.imageOverlay.setOpacity(value);
    }
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
  font-size: clamp(0.7rem, min(1.7vh, 1.7vw), 1.1rem);
  --default-font-size: 1em;
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
  overflow: auto;

  font-family: Verdana, Arial, Helvetica, sans-serif;
}

a {
  text-decoration: none;
  color: var(--smithsonian-yellow);
}

ul {
  margin-left: 1rem;
}

#intro-background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100% !important;
  height: 100% !important;
  background-color: rgba(0, 0, 0, 0.7); 
  z-index: 100;
}

.gradient-background {
    // rotated translucent background gradient
    background: linear-gradient(45deg,
                              rgb(14, 30, 40), 
                              rgb(22, 50, 65), 
                              rgb(30 70 90));
  }

#introduction-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translateX(-50%) translateY(-50%);
  height: fit-content;
  // outline: 5px solid var(--accent-color);
  border-radius: 1em;
  z-index: 1000;

  @media (max-width: 700px) {
    width: 95%;
    padding: 1em;
  }

  @media (min-width: 701px) {
    width: 75%;
    padding: 2em;
  }

  .span-accent {
    color: var(--accent-color);
  }


  
  //font-size: calc(1.1 * var(--default-font-size));
  // line-height: var(--default-line-height);

  .v-list-item {
    color: #eee;
  }
  
  .intro-text {
    color: white;
    font-size: 1em;
    line-height: 1.5em;
  }
  
  strong {
    color: white;
  }
  
  div#intro-bottom-controls {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: center;

    gap: 1em;
    margin-top:0.5em;

    .v-btn.v-btn--density-default {
        max-height: calc(1.6 * var(--default-line-height));
      }  

    .v-btn--size-default {
      font-size: calc(0.9 * var(--default-font-size));
    }    
    
    #intro-next-button {
      background-color: rgba(18, 18, 18,.5);
    }
  }
}

#intro-window-close-button {
    position: absolute;
    top: 0.25em;
    right: 0.25em;

    &:hover {
      cursor: pointer;
    }
}

#main-content {
  position: fixed;
  width: 100%;
  height: var(--app-content-height);
  overflow: auto;
  transition: height 0.1s ease-in-out;
}

#app {
  width: 100%;
  height: 100%;
  margin: 0;
  overflow: hidden;
  font-size: 12pt;
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
  grid-template-rows: 50px var(--map-height) 78px .5fr .5fr;
  gap: 20px 10px;
  
  > * {
    background-color: transparent;
  }
  
  > div {
    outline: 1px solid transparent;
  }
  
  #user-options {
    min-width: 200px;
    margin-left: 1.5rem;
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

  #bottom-options {
    margin-left: 1.5rem;
    grid-column: 3 / 4;
    grid-row: 3 / 5;
  }
  
  #information {
    padding: 1rem;
    grid-column: 2 / 3;
    grid-row: 4 / 6;
  }

  #body-logos { 
    grid-column: 3 / 4;
    grid-row: 5 / 6;
    align-self: end;
    justify-self: end;
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
  padding-inline: 1rem;
  // margin-right: 200px;
}

a {
  text-decoration: underline;
  font-weight: bold;
  color: var(--accent-color-2);
}

.v-dialog > .v-overlay__content > .v-card {
  padding: 1rem;
}

.v-overlay__content {
    align-self: center;
    margin: unset;
  }

  .v-card-text {
    height: 40vh;
  }

#credits-dialog {
  display: flex;
  width: calc(100% - 1rem);
}

.dialog-card {
  align-self: center;
  max-width: 80%;
}

// prevent overflows of the content
#user-options {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  gap: 5px; 
}

#date-radio {
  padding-bottom: 0.5rem;
}

#locations-of-interest {
  border: 1px solid black;
  padding-block: 0.5rem;
  padding-inline: 1rem;
  height: fit-content;

  h3 {
    font-weight: 500;
  }
}

.big-label {
  font-size: 2rem;
  text-align: right;
  margin-right: 0.5rem;
  align-self: end;
  color: var(--smithsonian-blue);
}

#when {
  align-self: start;
}

#slider-row, #when {
  margin-top: 1.5rem;
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
  
  .forward-geocoding-container {
    position: absolute;
    bottom: 0;
    left: 0;
    
    z-index: 1000;
    width: 250px;
  }

  > #map-legend {
    position: absolute;
    top: 0;
    right: 65px;
    width: fit-content;
    z-index: 1000;
    
    display: flex;
    align-items: center;
    gap: 0.5rem;
    
    color: black;
    background-color: #fff5;
    padding-left: 0.5rem;
    padding-right: 0.25rem;
    
    backdrop-filter: blur(5px);
    
    hr.line-legend {
      display: inline-block;
      border: 0.5px solid #c10124;
      width: 3rem;
    }
  }

  > .colorbar-container {
    flex-grow: 0;
    flex-shrink: 1;

    .colorbar-label {
      transform: rotate(180deg) translate(-110%,-50%)
    }

    .unit-label {
      font-size: 11pt;
    }
  }
}

#slider-row {
  display: flex;
  flex-direction: row;
  padding-left: 0;
  
  > #play-pause-button {
    height: fit-content;
    align-self: center;
    padding-inline: 0.5rem;
    margin-left: 0.75rem;
    width: 2.5rem;
    color: var(--accent-color);
    border: 2px solid var(--accent-color);
  }

  .icon-wrapper {
    padding-inline: 0.5rem !important;
  }
}

.time-slider {

  .v-slider-thumb {

    .v-slider-thumb__surface::after {
      background-image: url("./assets/smithsonian.png");
      background-size: 30px 30px;
      height: 30px;
      width: 30px;
    }
    
    .v-slider-thumb__label {
      background-color: var(--accent-color-2);
      border: 0.25rem solid var(--accent-color);
      width: max-content;
      height: 2.5rem;
      font-size: 1rem;
    
      &::before {
        color: var(--accent-color);
      }
    }
  }

  .v-slider {
  
    .v-slider.v-input--horizontal {
      grid-template-rows: auto 0px;
    }
    
    .v-slider.v-input--horizontal .v-slider-thumb__label {
      // top: calc(var(--v-slider-thumb-size) * 1.5);
      z-index:2000;
    }
    
    .v-slider.v-input--horizontal .v-slider-thumb__label::before {
        border-left: 6px solid transparent;
        border-right: 6px solid transparent;
        border-bottom: 6px solid transparent;
        border-top: 6px solid currentColor;
        bottom: -15px;
    }
  }
}

#control-checkboxes {
}

#body-logos {
  display: flex;
  flex-direction: row;
  img {
    height: 35px;
    vertical-align: middle;
    margin: 2px;
  }
}

#icons-container > a[href="https://worldwidetelescope.org/home/"] {
  display: none;
}

.v-radio-group .v-input__details {
  display: none;
}

.leaflet-image-layer {
  border: 1px solid blue;
}

</style>
