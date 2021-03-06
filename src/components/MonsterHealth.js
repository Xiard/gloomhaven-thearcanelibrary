import React, { Component } from 'react';
import { Grid, Row, Col, Button, ProgressBar } from 'react-bootstrap';
import GameStore from '../stores/GameStore';
import GameActions from '../actions/GameActions';
import * as MONSTER_STATS from '../constants/MonsterStats';

class MonsterHealthComponent extends Component {

  constructor() {
    super();

    this.state = {
      game: GameStore.getGame(),
      displayMonsterType: "ACTIVE"
    } 

    this.onChange = this.onChange.bind(this);
    this.handleScenarioChange = this.handleScenarioChange.bind(this);
    this.scenarioGo = this.scenarioGo.bind(this);
  }

  componentWillMount() {
    GameStore.addGameChangeListener(this.onChange);
  }

  componentWillUnmount() {
    GameStore.removeGameChangeListener(this.onChange);
  }

  onChange() {
    this.setState({
      game: GameStore.getGame()
    });
  }

  getAllActiveMonsters() {
    let activeMonsterList = [];

    // cycle through all the monsters of all different types, looking for the ones that are active
    for (let monsterNameProperty in this.state.game.monsterHealth.monsters) {
      if (this.state.game.monsterHealth.monsters.hasOwnProperty(monsterNameProperty)) {
        let monsterRecords = this.state.game.monsterHealth.monsters[monsterNameProperty];

        let activeMonsterRecords = monsterRecords.filter(function(currentValue, index) {
          return currentValue.alive;
        });

        activeMonsterList = activeMonsterList.concat(activeMonsterRecords);
      }
    }

    return activeMonsterList;
  }

  getMonsterType(monsterName) {
    return MONSTER_STATS.MONSTERS.monsters[monsterName];
  }

  getMonsterLevelStats(monster) {
    return this.getMonsterType(monster.name).level[monster.level];
  }

  makeMonsterToggleButton(monsterToDisplay) {
    let buttonClass = "btn-monster-dead";
    if (monsterToDisplay.alive) {
      if (monsterToDisplay.elite) {
        buttonClass = "btn-monster-elite";
      }
      else {
        buttonClass = "btn-monster-normal";
      }
    }

    return (
      <Button disabled={this.isDisplayActiveOnly()} block onClick={() => this.toggleMonster(monsterToDisplay)} className={buttonClass}>{monsterToDisplay.name + ' ' + (monsterToDisplay.number)}</Button>
    );
    
  }

  makeMonsterKillButton(monsterToDisplay) {
    return (
      <Button disabled={!monsterToDisplay.alive} block onClick={() => { if(confirm("Kill monster?")) { this.killMonster(monsterToDisplay); } } } className={"btn-lightning" + (!monsterToDisplay.alive ? " btn-disabled" : "")}>Kill Monster</Button>
    );
  }

  calculateBossHealth(healthString, scenarioLevel) {
    let health = 0;

    let healthParts = healthString.split("x");

    for (let i=0; i<healthParts.length; i++) {
      let healthPart = healthParts[i];

      // translate this part of the health string to a number
      if (healthPart === "C") {
        // number of characters
        healthPart = 4; // UPDATE THIS TO NUMBER OF CHARACTERS WHEN IMPLEMENTED
      }
      else if (healthPart === "L") {
        // scenario level
        healthPart = scenarioLevel;
      }

      if (health <= 0) {
        // this is the first number we're adding to the calculation
        health = healthPart
      }
      else {
        // multiple this number by the previous health number
        health *= healthPart;
      }
    }

    return health;
  }

  makeMonsterHealthProgressBar(monsterToDisplay) {
    let monsterType = this.getMonsterType(monsterToDisplay.name);
    let monsterLevelStats = this.getMonsterLevelStats(monsterToDisplay);

    let maxHealth = 0;

    if (monsterType.isBoss) {
      maxHealth = this.calculateBossHealth(monsterLevelStats.health, monsterToDisplay.level);
    }
    else {
      if (monsterToDisplay.elite) {
        maxHealth = monsterLevelStats.elite.health;
      }
      else {
        maxHealth = monsterLevelStats.normal.health;
      }
    }

    let healthNow = maxHealth - monsterToDisplay.damage;
    if (healthNow < 0) {
      healthNow = 0;
    }

    return (
      <ProgressBar label={healthNow} max={maxHealth} min={0} now={healthNow} className="progress-grey" />
    );
  }

  makeMonsterDamageHealButton(monsterToDisplay, isHeal) {
    let text = "-";
    let damageAmount = 1;
    let buttonClass = "btn-doomstalker";

    if (isHeal) {
      text = "+";
      damageAmount = -1;
      buttonClass = "btn-brute";
    }

    if (!monsterToDisplay.alive) {
      buttonClass += " btn-disabled"
    }

    return (
      <Button disabled={!monsterToDisplay.alive} block onClick={() => this.changeMonsterDamage(monsterToDisplay, damageAmount)} className={buttonClass}>{text}</Button>
    );
  }

  makeMonsterScenarioLevelButton(monsterToDisplay) {
    return (
      <Button disabled={!monsterToDisplay.alive} onClick={() => this.changeMonsterScenarioLevel(monsterToDisplay)} className={(!monsterToDisplay.alive ? " btn-disabled" : "")} block>{monsterToDisplay.level}</Button>
    );
  }

  makeDisplayedMonsterSection(monsterToDisplay) {
    let key = monsterToDisplay.name + monsterToDisplay.number;

    let monsterToggleButton = this.makeMonsterToggleButton(monsterToDisplay);
    let monsterKillButton = this.makeMonsterKillButton(monsterToDisplay);
    let monsterHealthProgressBar = this.makeMonsterHealthProgressBar(monsterToDisplay);
    let monsterTakeDamageButton = this.makeMonsterDamageHealButton(monsterToDisplay, false);
    let monsterHealButton = this.makeMonsterDamageHealButton(monsterToDisplay, true);
    let monsterLevelButton = this.makeMonsterScenarioLevelButton(monsterToDisplay);

    return(
      <Col xs={12} md={6} key={key} className="monster-health-col">
        <Row>
          <Col xs={8} className="wide-right">
            {monsterToggleButton}
          </Col>
          <Col xs={4} className="wide-left">
            { this.isDisplayActiveOnly() ? monsterKillButton : monsterLevelButton }
          </Col>
        </Row>
        <Row>
          <Col xs={8} className="wide-right">
            {monsterHealthProgressBar}
          </Col>
          <Col xs={2} className="wide-both">
            {monsterTakeDamageButton}
          </Col>
          <Col xs={2} className="wide-left">
            {monsterHealButton}
          </Col>
        </Row>
      </Col>
    );
  }

  isDisplayActiveOnly() {
    return this.state.displayMonsterType === "ACTIVE";
  }

  makeDisplayedMonsterSections() {
    let displayedMonstersData = [];
    let displayedMonstersHTML = [];

    // find which monsters to display
    if (this.isDisplayActiveOnly()) {
      displayedMonstersData = this.getAllActiveMonsters();
    }
    else {
      displayedMonstersData = this.state.game.monsterHealth.monsters[this.state.displayMonsterType];
    }

    for (let i=0; i<displayedMonstersData.length; i++) {
      let monsterToDisplay = displayedMonstersData[i];

      displayedMonstersHTML.push(this.makeDisplayedMonsterSection(monsterToDisplay));
    }

    return displayedMonstersHTML;
  }

  getScenarioDetails(scenario) {
    return MONSTER_STATS.SCENARIO_MONSTERS[scenario];
  }

  scenarioGo() {
    let gameCopy = this.state.game;

    // first clear all existing monsters
    gameCopy.monsterHealth.monsters = {};

    // find all the monster types that are in this scenario by default
    let scenarioDetails = this.getScenarioDetails(gameCopy.monsterHealth.scenario - 1); // array starts with scenario 1 at first index, so use -1

    let monsterNames = [];
    for (let i=0; i<scenarioDetails.decks.length; i++) {
      monsterNames.push(scenarioDetails.decks[i].name);
    }

    for (let i=0; i<monsterNames.length; i++) {
      let monsterName = monsterNames[i];

      // find the monsters stats in the data structure
      let monsterType = this.getMonsterType(monsterName);

      let monsters = [];

      for (let j=0; j<monsterType.standeeCount; j++) {
        // add a monster record to the data structure
        monsters.push({
          name: monsterName,
          number: j + 1,
          elite: false,
          level: gameCopy.monsterHealth.defaultScenarioLevel,
          alive: false,
          damage: 0,
        });
      }

      gameCopy.monsterHealth.monsters[monsterName] = monsters;
    }

    this.setState({
      game: gameCopy,
      displayMonsterType: "ACTIVE"
    }, function() {
      GameActions.changeGame(this.state.game);
    });
  }

  createMonsterHeaderButton(monsterName) {
    return (
      <Col xs={12} md={3} key={monsterName}>
        <Button onClick={() => this.showMonsters(monsterName)} className="btn-lightning" block>{monsterName}</Button>
      </Col>
    );
  }

  createMonsterHeaderActiveButton() {
    return (
      <Col xs={12} md={3} key={"active"}>
        <Button onClick={() => this.showActiveMonsters()} className="btn-scoundrel" block>All Active</Button>
      </Col>
    );
  }

  showActiveMonsters() {
    this.setState({
      displayMonsterType: "ACTIVE"
    });
  }

  showMonsters(monsterName) {
    this.setState({
      displayMonsterType: monsterName
    });
  }

  handleScenarioChange(event) {
    const target = event.target;
    const value = target.value;

    let gameCopy = this.state.game;
    gameCopy.monsterHealth.scenario = value;

    this.updateGame(gameCopy);
  }

  createScenarioLevelButton(value, activeValue) {
    return (
      <Col xs={1} md={1} key={value}>
        <Button onClick={() => this.levelButtonClick(value)} className={activeValue === value ? "btn-doomstalker" : ""} block>{value}</Button>
      </Col>
    );
  }

  levelButtonClick(value) {
    let gameCopy = this.state.game;
    gameCopy.monsterHealth.defaultScenarioLevel = value;

    this.updateGame(gameCopy);
  }

  killMonster(monster) {
    let gameCopy = this.state.game;

    let monsterIndex = monster.number - 1;

    gameCopy.monsterHealth.monsters[monster.name][monsterIndex].alive = false;
    gameCopy.monsterHealth.monsters[monster.name][monsterIndex].damage = 0;

    this.updateGame(gameCopy);
  }

  changeMonsterScenarioLevel(monster) {
    let gameCopy = this.state.game;
    let monsterIndex = monster.number - 1;

    let newLevel = gameCopy.monsterHealth.monsters[monster.name][monsterIndex].level + 1;
    newLevel %= 8;

    gameCopy.monsterHealth.monsters[monster.name][monsterIndex].level = newLevel;

    this.updateGame(gameCopy);
  }

  changeMonsterDamage(monster, damageAmount) {
    let gameCopy = this.state.game;
    
    let monsterLevelStats = this.getMonsterLevelStats(monster);
    let monsterType = this.getMonsterType(monster.name);
    let monsterIndex = monster.number - 1;
    let damage = monster.damage + damageAmount;

    let health = 0;
    if (monsterType.isBoss) {
      health = monsterLevelStats.health;
    }
    else {
      if (monster.elite) {
        health = monsterLevelStats.elite.health;
      }
      else {
        health = monsterLevelStats.normal.health; 
      }
    }

    if (damage >= health) {
      damage = health;
    }
    else if (damage < 0) {
      damage = 0;
    }

    if (gameCopy.monsterHealth.monsters[monster.name][monsterIndex].damage !== damage) {
      gameCopy.monsterHealth.monsters[monster.name][monsterIndex].damage = damage;

      this.updateGame(gameCopy);
    }
  }

  toggleMonster(monster) {
    let gameCopy = this.state.game;

    let monsterType = this.getMonsterType(monster.name);
    let monsterIndex = monster.number - 1;
    
    // regular monster: dead -> alive (normal) -> alive (elite) -> dead -> ...
    // boss monster: dead -> alive (normal) -> dead -> ...
    if (!monster.alive) {
      // dead -> alive (normal)
      gameCopy.monsterHealth.monsters[monster.name][monsterIndex].alive = true;
      gameCopy.monsterHealth.monsters[monster.name][monsterIndex].elite = false;
    }
    else if (monster.elite) {
      // alive (elite) -> dead
      gameCopy.monsterHealth.monsters[monster.name][monsterIndex].alive = false;
      gameCopy.monsterHealth.monsters[monster.name][monsterIndex].elite = false;
      gameCopy.monsterHealth.monsters[monster.name][monsterIndex].damage = 0;
    }
    else if (!monsterType.isBoss) {
      // currently alive and normal
      // alive (normal) -> alive (elite)
      gameCopy.monsterHealth.monsters[monster.name][monsterIndex].elite = true;
    }
    else {
      // currently alive and normal
      // alive (normal) -> dead
      gameCopy.monsterHealth.monsters[monster.name][monsterIndex].alive = false;
      gameCopy.monsterHealth.monsters[monster.name][monsterIndex].damage = 0;
    }

    this.updateGame(gameCopy);
  }

  updateGame(gameCopy) {
    this.setState({
      game: gameCopy
    }, function() {
      GameActions.changeGame(this.state.game);
    });
  }

  render() {
    let scenarioLevelButtons = [];

    for (let i=0; i<=7; i++) {
      scenarioLevelButtons.push(this.createScenarioLevelButton(i, this.state.game.monsterHealth.defaultScenarioLevel));
    }

    let monsterHeaderButtons = [];

    for (let monsterNameProperty in this.state.game.monsterHealth.monsters) {
      if (this.state.game.monsterHealth.monsters.hasOwnProperty(monsterNameProperty)) {
          monsterHeaderButtons.push(this.createMonsterHeaderButton(monsterNameProperty));
      }
    }

    monsterHeaderButtons.push(this.createMonsterHeaderActiveButton());

    let scenarioNumber = "";
    if (this.state.game.monsterHealth.scenario > 0) {
      scenarioNumber = this.state.game.monsterHealth.scenario;
    }

    

    let displayedMonsterSections = this.makeDisplayedMonsterSections();

    return (
      <div className="container">
      	<Grid>
          <Row className="monster-health-row">
            <Col xs={12} md={12}>
              <p><strong>CAUTION!</strong> This is a work in progress feature and while it is mostly functioning, there are a couple of issues.</p>
              <ol>
                <li>Select scenario level</li>
                <li>Enter scenario number</li>
                <li>Press the <strong>Go</strong> button</li>
                <li>
                  To create monsters, press on the desired monster type
                  <ul>
                    <li>Each monster name has a number - this is the standee that it refers to</li>
                    <li>Tapping on the monster name will toggle between dead/normal/elite</li>
                    <li>The individual scenario level for each monster is displayed to the right of the name</li>
                    <li>Starting health will be the monster's health according to their level</li>
                  </ul>
                </li>
                <li>When you're done creating monsters, press the <strong>All Active</strong> button to show only monsters that are on the board</li>
                <li>The blue buttons control the monsters remaining health</li>
                <li>When a monster is dead, press the <strong>Kill Monster</strong> button to remove them from the active list</li>
              </ol>
            </Col>
          </Row>
          <Row className="monster-health-row">
            <Col xs={12} md={4}>
              Default Scenario Level
            </Col>
            {scenarioLevelButtons}
          </Row>
          {this.state.game.monsterHealth.defaultScenarioLevel > -1 &&
            <Row className="monster-health-row">
              <Col xs={12} md={4}>
                Scenario
              </Col>
              <Col xs={12} md={4}>
                <input type="number" className="form-control" value={scenarioNumber} onChange={this.handleScenarioChange} placeholder="Enter scenario number" />
              </Col>
              <Col xs={12} md={4}>
                <Button className="btn-scoundrel" block onClick={this.scenarioGo}>Go</Button>
              </Col>
            </Row>
          }
          {this.state.game.monsterHealth.scenario > -1 &&
            <Row className="monster-health-row">
              {monsterHeaderButtons}
            </Row>
          }
          <Row className="monster-heath-monsters-container">
            {displayedMonsterSections}
          </Row>
      	</Grid>
      </div>
    );
  }
}

export default MonsterHealthComponent;