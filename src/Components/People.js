import React from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import LinearProgress from '@mui/material/LinearProgress';
import IconButton from '@mui/material/IconButton';
import FirstPageIcon from '@material-ui/icons/FirstPage';
import LastPageIcon from '@material-ui/icons/LastPage';
import LaunchIcon from '@material-ui/icons/Launch';
import NextPageIcon from '@material-ui/icons/ChevronRight';
import PreviousPageIcon from '@material-ui/icons/ChevronLeft';
import SortOrderNone from '@material-ui/icons/UnfoldMore';
import SortOrderDesc from '@material-ui/icons/KeyboardArrowDown';
import SortOrderAsc from '@material-ui/icons/KeyboardArrowUp';
import InputBase from '@mui/material/InputBase';
import Divider from '@mui/material/Divider';
import PersonIcon from '@material-ui/icons/Person';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@material-ui/icons/FilterList';
import SearchDialog from './SearchDialog.js';
import PlanetPopup from './PlanetPopup.js';
import Button from '@mui/material/Button';
var _ = require('lodash');

class People extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      People: [],
      TotalPeopleCount: 0,
      CurrentPage: 1,
      InitialFetchComplete: false,
      TableDataLoading: false,
      LowerRange: 0,
      HigherRange: 0,
      SortColumn: "",
      SortDirection: "",
      SearchFilter: "",
      SearchDialogOpen: false,
      PlanetPopupOpen: false,
      OpenedPlanetID: 0,
      OpenedPlanetName: "",
      DisplayFetchingError: false
    }
  }

  SavePeopleToCache = (People, Page, People_Count) => {
    try {
       if(this.state.SearchFilter != "") {
         return;
       }
        People = _.map(People, function(item) {
          var newItem = _.omit(item, 'homeworld_is_loaded');
          return newItem;
        });

       var item = {
         fetch_date: Math.round((new Date()).getTime() / 1000),
         People: People,
         Page: Page
       }

       var item2 = {
         fetch_date: Math.round((new Date()).getTime() / 1000),
         People_Count: People_Count
       }

       const myObjStr = JSON.stringify(item);
       const myObjStr2 = JSON.stringify(item2);

       localStorage.setItem('People_' + Page, myObjStr);
       localStorage.setItem('COUNT_PEOPLE', myObjStr2);

     }
     catch(ex) {
       console.log(ex);
     }
  }

  setStateAsync = async(state) => {
  return new Promise((resolve) => {
    this.setState(state, resolve)
  });
}

  LoadPeopleFromCache = async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 800));

      if(this.state.SortColumn.length == 0 && this.state.SearchFilter.length == 0) {
        var cache_name = "People_" + this.state.CurrentPage;

        const item = localStorage.getItem(cache_name);
        var obj = JSON.parse(item);

        obj.People = _.map(obj.People, function(item) {
          var newItem = _.extend({homeworld_is_loaded: false}, item);
          return newItem;
        });

        const COUNT_PEOPLE = localStorage.getItem("COUNT_PEOPLE");
        const obj2 = JSON.parse(COUNT_PEOPLE);

        var fetched_date = obj.fetch_date;
        var now_date = Math.round((new Date()).getTime() / 1000);

        var seconds_difference = Math.abs(fetched_date - now_date);

        if(seconds_difference > 600) {
          return false;
        }

        await this.setStateAsync({ People: obj.People, TotalPeopleCount: obj2.People_Count });
        await this.setStateAsync({ LowerRange: this.GetLowerRange(), HigherRange: this.GetHigherRange() });
        await this.setStateAsync({ InitialFetchComplete: true, TableDataLoading: false });
        this.FetchPlanets();
      }
      else {
        var AllPeople = await this.FetchAllPeopleData();
        var Pages = [];
        var Upated_People_Count = 0;

        if(this.state.SortColumn.length > 0 && this.state.SortDirection.length > 0) {
          var OrderedList = await this.GetOrderedList(AllPeople, this.GetColumnName(this.state.SortColumn), this.state.SortDirection.toLowerCase());

          if(this.state.SearchFilter.length == 0) {
            Pages = _.chunk(OrderedList, 10);
            Upated_People_Count = AllPeople.length;
          }
          else {
            var SearchFilter = this.state.SearchFilter.toLowerCase();
            OrderedList = _.filter(OrderedList, function(o) { return o.name.toLowerCase().includes(SearchFilter); });
            Pages = _.chunk(OrderedList, 10);
            Upated_People_Count = OrderedList.length;
          }
        }
        else {
          var SearchFilter = this.state.SearchFilter.toLowerCase();
          AllPeople = _.filter(AllPeople, function(o) { return o.name.toLowerCase().includes(SearchFilter); });
          Pages = _.chunk(AllPeople, 10);
          Upated_People_Count = AllPeople.length;
        }

        await this.setStateAsync({ People: Pages[this.state.CurrentPage - 1] !== undefined ? Pages[this.state.CurrentPage - 1] : [], TotalPeopleCount: Upated_People_Count });
        await this.setStateAsync({ LowerRange: this.GetLowerRange(), HigherRange: this.GetHigherRange() });
        await this.setStateAsync({ InitialFetchComplete: true, TableDataLoading: false });

        this.FetchPlanets();
      }

      return true;
    }
    catch(exception) {
      console.log(exception);
      return false;
    }
  }

  LoadPlanet = async (Planet_ID) => {
    await new Promise(resolve => setTimeout(resolve, 800));

    var Planet_Name = "";

    try {
      var cache_name = "Planet_" + Planet_ID;

      const item = localStorage.getItem(cache_name);
      var obj = JSON.parse(item);

      if(obj) {
        Planet_Name = obj.Name;
      }
      else {
        const requestOptions = {method: 'GET', headers: {'Content-Type' : 'application/json'}   };
        const response = await fetch("https://swapi.dev/api/planets/" + Planet_ID);
        const json = await response.json();

        var planet = { Name: json.name, Diameter: json.diameter, Climate: json.climate, Population: json.population, fetch_date: Math.round((new Date()).getTime() / 1000) };
        const myObjStr = JSON.stringify(planet);
        localStorage.setItem(cache_name, myObjStr);
        Planet_Name = json.name;
      }
     }
     catch(exception) {
       this.setState({DisplayFetchingError: true});
       console.log(exception);
     }

     return Planet_Name;
  }

  FetchPlanets = async () => {
    try {
      var People_Object = this.state.People;

      const promises = People_Object.map(async People => {
        if(!People.homeworld_is_loaded) {
          var Planet_Name = await this.LoadPlanet(People.homeworld);
          var item = _.extend({homeworld_name: Planet_Name}, People);
          item.homeworld_is_loaded = true;
          return item;
        }
        else {
          return item;
        }
      })

      const New_People = await Promise.all(promises);
      this.setState({People: New_People});
     }
     catch(exception) {
       console.log(exception);
     }
  }

  async componentDidMount() {
     try {
       if(await this.LoadPeopleFromCache()) {
         return;
       }

       const requestOptions = {method: 'GET', headers: {'Content-Type' : 'application/json'}   };
       const response = await fetch("https://swapi.dev/api/people/?page=" + this.state.CurrentPage);
       const json = await response.json();

       var People = _.map(json.results, function(item) {
         var newItem = _.pick(item, 'name', 'height', 'mass', 'created', 'edited', 'homeworld')
         const split_homeworld = newItem.homeworld.split('/');
         newItem.homeworld = split_homeworld[split_homeworld.length-2];
         newItem.homeworld_is_loaded = false;
         return newItem;
       });

       await this.SavePeopleToCache(People, this.state.CurrentPage, json.count);

       this.setState({
         People: People,
         TotalPeopleCount: json.count
       }, () => {
         this.FetchPlanets();

         this.setState({
           InitialFetchComplete: true,
           TableDataLoading: false,
           LowerRange: this.GetLowerRange(),
           HigherRange: this.GetHigherRange()
         })
       });
     }
     catch(exception) {
       this.setState({ InitialFetchComplete: true, DisplayFetchingError: true });
       console.log(exception);
     }
  }

  GetLowerRange = () => {
    var Lower_Range = 0;

    try {
       Lower_Range = this.GetPageCount == 0 ? 0 : (((this.state.CurrentPage*10)-10)+1)
    }
    catch(exception) {
      console.log(exception);
    }

    return Lower_Range;
  }

  GetHigherRange = () => {
    var Higher_Range = 0;

    try {
       Higher_Range = this.GetPageCount == 0 ? 0 : (((this.state.CurrentPage*10)-10))+this.state.People.length
    }
    catch(exception) {
      console.log(exception);
    }

    return Higher_Range;
  }

  GetPageCount = () => {
    var Page_Count = 0;

    try {
       Page_Count = (Math.ceil(this.state.TotalPeopleCount/10));
    }
    catch(exception) {
      console.log(exception);
    }

    return Page_Count;
  }

  FetchData = async () => {
    try {

      if(await this.LoadPeopleFromCache()) {
        let tableBody = document.getElementById('TableElement');
        tableBody.scrollIntoView();
        return;
      }
       const requestOptions = {method: 'GET', headers: {'Content-Type' : 'application/json'}   };
       var apiUrl = "https://swapi.dev/api/people/?page=" + this.state.CurrentPage;
       var search = this.state.SearchFilter == "" ? "" : "&search=" + this.state.SearchFilter;
       apiUrl = apiUrl + search;

       const response = await fetch(apiUrl);
       const json = await response.json();

       var People = _.map(json.results, function(item) {
         var newItem = _.pick(item, 'name', 'height', 'mass', 'created', 'edited', 'homeworld')
         const split_homeworld = newItem.homeworld.split('/');
         newItem.homeworld = split_homeworld[split_homeworld.length-2];
         newItem.homeworld_is_loaded = false;
         return newItem;
       });

       await this.SavePeopleToCache(People, this.state.CurrentPage, json.count);

       this.setState({
         People: People,
         TotalPeopleCount: json.count
       }, () => {
         this.FetchPlanets();
         let tableBody = document.getElementById('TableElement');
         tableBody.scrollIntoView();
         this.setState({
           TableDataLoading: false,
           LowerRange: this.GetLowerRange(),
           HigherRange: this.GetHigherRange()
         })
       });
     }
     catch(exception) {
       this.setState({DisplayFetchingError: true});
       console.log(exception);
     }
  }

  NavigateToTheNextPage = () => {
    try {
      if(this.state.CurrentPage < this.GetPageCount() && !this.state.TableDataLoading) {
        this.setState({
          CurrentPage: this.state.CurrentPage + 1,
          TableDataLoading: true
        }, () => {
          this.FetchData();
        });
      }
    }
    catch(exception) {
      this.setState({DisplayFetchingError: true});
      console.log(exception);
    }
  }

  OpenPlanetPopup = (Planet_ID, Planet_Name) => {
    try {
       if(!this.state.TableDataLoading && Planet_Name != "unknown") {
         this.setState({PlanetPopupOpen: true, OpenedPlanetID: Planet_ID, OpenedPlanetName: Planet_Name});
       }
     }
     catch(exception) {
       console.log(exception);
     }
  }

  NavigateToThePreviousPage = () => {
    try {
      if(this.state.CurrentPage > 1 && !this.state.TableDataLoading) {
        this.setState({
          CurrentPage: this.state.CurrentPage - 1,
          TableDataLoading: true
        }, () => {
          this.FetchData();
        });
      }
    }
    catch(exception) {
      console.log(exception);
    }
  }

  NavigateToTheFirstPage = () => {
    try {
      if(this.state.CurrentPage > 1 && !this.state.TableDataLoading) {
        this.setState({
          CurrentPage: 1,
          TableDataLoading: true
        }, () => {
          this.FetchData();
        });
      }
    }
    catch(exception) {
      console.log(exception);
    }
  }

  NavigateToTheLastPage = () => {
    try {
      if(this.state.CurrentPage < this.GetPageCount() && !this.state.TableDataLoading) {
        this.setState({
          CurrentPage: this.GetPageCount(),
          TableDataLoading: true
        }, () => {
          this.FetchData();
        });
      }
    }
    catch(exception) {
      console.log(exception);
    }
  }

  GetSecondsDifferenceBetweenDates = async (date1, date2) => {
    var seconds_difference = null;

    try {
        seconds_difference = Math.abs(date1 - date2);
     }
     catch(exception) {
       console.log(exception);
     }

     return seconds_difference;
  }

  FetchAllPeopleData = async () => {
    try {
       const requestOptions = {method: 'GET', headers: {'Content-Type' : 'application/json'}   };
       const response = await fetch("https://swapi.dev/api/people/");
       const json = await response.json();
       var Total_Page_Count = (Math.ceil(json.count/10));
       var People_All_Pages = [];

       if(Total_Page_Count > 0) {
         for (var i = 1; i <= Total_Page_Count; i++) {
             var cache_name = "People_" + i;
             const item = localStorage.getItem(cache_name);
             var obj = JSON.parse(item);

             var seconds_difference = (obj == null) ? null : await this.GetSecondsDifferenceBetweenDates(obj.fetch_date, Math.round((new Date()).getTime() / 1000));

             if(seconds_difference > 600 || seconds_difference == null) {
               const requestOptions2 = {method: 'GET', headers: {'Content-Type' : 'application/json'}   };
               const response2 = await fetch("https://swapi.dev/api/people/?page=" + i);
               const json2 = await response2.json();

               var People = _.map(json2.results, function(item99) {
                 var newItem = _.pick(item99, 'name', 'height', 'mass', 'created', 'edited', 'homeworld')
                 const split_homeworld = newItem.homeworld.split('/');
                 newItem.homeworld = split_homeworld[split_homeworld.length-2];
                 newItem.homeworld_is_loaded = false;
                 return newItem;
               });

               People_All_Pages = _.unionBy(People, People_All_Pages, "name");
               await this.SavePeopleToCache(People, i, json2.count);
             }
             else {
               People_All_Pages = _.union(obj.People, People_All_Pages, "name");
             }
         }
       }
     }
     catch(exception) {
       this.setState({DisplayFetchingError: true});
       console.log(exception);
     }

     return People_All_Pages;
  }

  FetchAllPlanetsData = async (People_All_Pages) => {
    try {
      for (var i = 0; i < People_All_Pages.length; i++) {
        var cache_name = "Planet_" + People_All_Pages[i].homeworld;
        const item = localStorage.getItem(cache_name);
        var obj = JSON.parse(item);

        var seconds_difference = (obj == null) ? null : await this.GetSecondsDifferenceBetweenDates(obj.fetch_date, Math.round((new Date()).getTime() / 1000));

        if(seconds_difference > 600 || seconds_difference == null) {
          const requestOptions = {method: 'GET', headers: {'Content-Type' : 'application/json'}   };
          const response = await fetch("https://swapi.dev/api/planets/" + People_All_Pages[i].homeworld);
          const json = await response.json();

          var planet = { Name: json.name, Diameter: json.diameter, Climate: json.climate, Population: json.population, fetch_date: Math.round((new Date()).getTime() / 1000) };
          const myObjStr = JSON.stringify(planet);
          localStorage.setItem(cache_name, myObjStr);
          People_All_Pages[i].homeworld_name = json.name;
        }
        else {
          People_All_Pages[i].homeworld_name = obj.Name;
        }
      }
     }
     catch(exception) {
       this.setState({DisplayFetchingError: true});
       console.log(exception);
     }

     return People_All_Pages;
  }


  GetColumnName = (Column) => {
    try {
      switch(Column) {
         case 'Name':
           return 'name';
         case 'Height':
           return 'height';
         case 'Mass':
           return 'mass';
         case 'Created':
           return 'created';
         case 'Edited':
           return 'edited';
         case 'Planet Name':
           return 'homeworld';
          default:
            return null;
        }
     }
     catch(ex) {
       console.log(ex);
     }
  }

  GetOrderedList = async (List, Column, SortDirection) => {
    try {
      switch(Column) {
         case 'name':
           return _.orderBy(List, [Column],  [SortDirection]);
         case 'height':
           return _.orderBy(List, function (o) { return new Number(o.height != "unknown" ? o.height.replace(",", "") : 0); }, [SortDirection]);
         case 'mass':
           return _.orderBy(List, function (o) { return new Number(o.mass != "unknown" ? o.mass.replace(",", "") : 0); }, [SortDirection]);
         case 'created':
           return _.orderBy(List, [Column],  [SortDirection]);
         case 'edited':
           return _.orderBy(List, [Column],  [SortDirection]);
         case 'homeworld':
           var PeopleWithPlanetNames = await this.FetchAllPlanetsData(List);
           var ordered = _.orderBy(PeopleWithPlanetNames, ['homeworld_name'],  [SortDirection]);
          return ordered;
          default:
            return null;
        }
     }
     catch(ex) {
       console.log(ex);
     }
  }

  ApplySort = async (SourceColumn) => {
    try {
      if(this.state.TableDataLoading) {
        return;
      }

      this.setState({
        TableDataLoading: true,
        SortColumn: SourceColumn != this.state.SortColumn ? SourceColumn : this.state.SortDirection == "ASC" ? "" : SourceColumn,
        SortDirection: (this.state.SortColumn != SourceColumn || this.state.SortDirection == "ASC" || this.state.SortDirection == "") ? this.state.SortDirection == "ASC" && this.state.SortColumn == SourceColumn ? "" : "DESC" : "ASC"
      }, async () => {
        if(this.state.SortColumn.length != 0 && this.state.SortDirection.length != 0) {
          if(this.state.SearchFilter.length == 0) {
            var AllPeople = await this.FetchAllPeopleData();
            var OrderedList = await this.GetOrderedList(AllPeople, this.GetColumnName(SourceColumn), this.state.SortDirection.toLowerCase());
            var Pages = _.chunk(OrderedList, 10);
            await this.setStateAsync({ People: Pages[this.state.CurrentPage - 1], TotalPeopleCount: AllPeople.length });
            await this.setStateAsync({ LowerRange: this.GetLowerRange(), HigherRange: this.GetHigherRange() });
            await this.setStateAsync({ TableDataLoading: false });
          }
          else {
            var SearchFilter = this.state.SearchFilter.toLowerCase();
            var AllPeople = await this.FetchAllPeopleData();
            var OrderedList = await this.GetOrderedList(AllPeople, this.GetColumnName(SourceColumn), this.state.SortDirection.toLowerCase());
            OrderedList = _.filter(OrderedList, function(o) { return o.name.toLowerCase().includes(SearchFilter); });
            var Pages = _.chunk(OrderedList, 10);
            await this.setStateAsync({ People: Pages[this.state.CurrentPage - 1], TotalPeopleCount: OrderedList.length });
            await this.setStateAsync({ LowerRange: this.GetLowerRange(), HigherRange: this.GetHigherRange() });
            await this.setStateAsync({ TableDataLoading: false });
          }
          this.FetchPlanets();
        }
        else {
          this.FetchData();
        }
      });
    }
    catch(exception) {
      console.log(exception);
    }
  }

  HandleDialogClose = () => {
    this.setState({SearchDialogOpen: false});
  }

  HandlePopupClose = () => {
    this.setState({PlanetPopupOpen: false, OpenedPlanetID: 0, OpenedPlanetName: ""});
  }

  ApplyFilter = (SearchFilter) => {
    try {
      if(SearchFilter != this.state.SearchFilter) {
        this.setState({
          TableDataLoading: true,
          SearchFilter: SearchFilter,
          SearchDialogOpen: false,
          CurrentPage: 1
        }, () => {
          this.FetchData();
        });
      }
      else {
        this.setState({ SearchDialogOpen: false });
      }
    }
    catch(exception) {
      console.log(exception);
    }
  }

  TryAgain = async () => {
    try {
       this.setState({InitialFetchComplete: false, DisplayFetchingError: false, TableDataLoading: true,
         People: [],
         TotalPeopleCount: 0,
         CurrentPage: 1,
         InitialFetchComplete: false,
         TableDataLoading: false,
         LowerRange: 0,
         HigherRange: 0,
         SortColumn: "",
         SortDirection: "",
         SearchFilter: "",
         SearchDialogOpen: false,
         PlanetPopupOpen: false,
         OpenedPlanetID: 0,
         OpenedPlanetName: ""
       }, () => {
         this.componentDidMount();
       });
     }
     catch(exception) {
       console.log(exception);
     }
  }

  render() {
    return (
      <div className="noselect">
        <div style={{display: this.state.InitialFetchComplete ? "none" : "block", position: 'absolute', width:'100vw', height:'100vh'}}>
          <Box sx={{position:'relative', display:'inline', left:'50%', top:'50%'}} >
            <CircularProgress/>
          </Box>
        </div>

        <div style={{textAlign:'center', display: this.state.InitialFetchComplete && this.state.DisplayFetchingError  ? "block" : "none"}}>
          <span style={{marginTop:"50px", textAlign:'center'}}>
            <h1>Oops!</h1>
            <p>We have ran into an issue when trying to communicate with the server.</p> <p>It's either an issue with your internet connection or the server.</p>
            <Button onClick={(e) => this.TryAgain() } style={{width:'270px', marginTop:'25px', textTransform: 'none'}} variant="contained">Try again</Button>
          </span>
        </div>

        <div style={{display: this.state.InitialFetchComplete && !this.state.DisplayFetchingError  ? "block" : "none"}}>
          <h1 style={{textAlign:'center'}} id="TableTitle"> Star Wars - People </h1>

          <span id="ContentHolder" style={{display: this.state.People.length == 0 && this.state.InitialFetchComplete && !this.state.TableDataLoading ? 'none' : "block"}}>
          <div id="navigationElementPages">
            <IconButton disabled={this.state.People.length == 0 || this.state.CurrentPage == 1 || this.state.TableDataLoading} onClick={() => { this.NavigateToTheFirstPage() }}> <FirstPageIcon/> </IconButton>
            <IconButton disabled={this.state.People.length == 0 || this.state.CurrentPage == 1 || this.state.TableDataLoading} onClick={() => { this.NavigateToThePreviousPage() }}> <PreviousPageIcon/> </IconButton>
            <span>Page <b> {this.state.People.length > 0 ? this.state.CurrentPage.toLocaleString() : 0} </b> of <b>{this.GetPageCount().toLocaleString()}</b></span>
            <IconButton  disabled={this.state.People.length == 0 || this.state.CurrentPage == this.GetPageCount() || this.state.TableDataLoading} onClick={() => { this.NavigateToTheNextPage() }}> <NextPageIcon/> </IconButton>
            <IconButton  disabled={this.state.People.length == 0 || this.state.CurrentPage == this.GetPageCount() || this.state.TableDataLoading} onClick={() => { this.NavigateToTheLastPage() }}> <LastPageIcon/> </IconButton>
          </div>

          <TableContainer style={{maxHeight:'calc(100vh - 180px)', overflow:'auto'}} id="TableContainer">
            <Table id="TableElement" stickyHeader aria-label="simple table">


              <TableHead>
                <TableRow>
                  <TableCell Sticky style={{zIndex: 800, left: 0, position: 'sticky', color: this.state.TableDataLoading ? 'gray' : "black", pointerEvents: this.state.TableDataLoading ? 'none' : "auto", width:'300px', backgroundColor: this.state.SortColumn == "Name" ? "#e1e1e1" : '#f1f1f1'}} onClick={(e) => this.ApplySort("Name")} className="TableHeader" align="center"> <div className="TableHeaderContents"> <span style={{marginRight: '10px'}}> Name </span> {this.state.SortColumn != "Name" ? <SortOrderNone/> : this.state.SortDirection == "ASC" ? <SortOrderAsc/> : <SortOrderDesc/> }     </div>      </TableCell>
                  <TableCell style={{color: this.state.TableDataLoading ? 'gray' : "black", pointerEvents: this.state.TableDataLoading ? 'none' : "auto", backgroundColor: this.state.SortColumn == "Height" ? "#e1e1e1" : '#f1f1f1'}} onClick={(e) => this.ApplySort("Height")} className="TableHeader" align="center"><div className="TableHeaderContents"> <span style={{marginRight: '10px'}}> Height </span> {this.state.SortColumn != "Height" ? <SortOrderNone/> : this.state.SortDirection == "ASC" ? <SortOrderAsc/> : <SortOrderDesc/> } </div></TableCell>
                  <TableCell style={{color: this.state.TableDataLoading ? 'gray' : "black", pointerEvents: this.state.TableDataLoading ? 'none' : "auto", backgroundColor: this.state.SortColumn == "Mass" ? "#e1e1e1" : '#f1f1f1'}} onClick={(e) => this.ApplySort("Mass")} className="TableHeader" align="center"><div className="TableHeaderContents"> <span style={{marginRight: '10px'}}> Mass </span> {this.state.SortColumn != "Mass" ? <SortOrderNone/> : this.state.SortDirection == "ASC" ? <SortOrderAsc/> : <SortOrderDesc/> } </div></TableCell>
                  <TableCell style={{color: this.state.TableDataLoading ? 'gray' : "black", pointerEvents: this.state.TableDataLoading ? 'none' : "auto", backgroundColor: this.state.SortColumn == "Created" ? "#e1e1e1" : '#f1f1f1'}} onClick={(e) => this.ApplySort("Created")} className="TableHeader" align="center"><div className="TableHeaderContents"> <span style={{marginRight: '10px'}}> Created </span> {this.state.SortColumn != "Created" ? <SortOrderNone/> : this.state.SortDirection == "ASC" ? <SortOrderAsc/> : <SortOrderDesc/> } </div></TableCell>
                  <TableCell style={{color: this.state.TableDataLoading ? 'gray' : "black", pointerEvents: this.state.TableDataLoading ? 'none' : "auto", backgroundColor: this.state.SortColumn == "Edited" ? "#e1e1e1" : '#f1f1f1'}} onClick={(e) => this.ApplySort("Edited")} className="TableHeader" align="center"><div className="TableHeaderContents"> <span style={{marginRight: '10px'}}> Edited </span> {this.state.SortColumn != "Edited" ? <SortOrderNone/> : this.state.SortDirection == "ASC" ? <SortOrderAsc/> : <SortOrderDesc/> } </div></TableCell>
                  <TableCell style={{color: this.state.TableDataLoading ? 'gray' : "black", pointerEvents: this.state.TableDataLoading ? 'none' : "auto", backgroundColor: this.state.SortColumn == "Planet Name" ? "#e1e1e1" : '#f1f1f1'}} onClick={(e) => this.ApplySort("Planet Name")} className="TableHeader" align="center"><div className="TableHeaderContents"> <span style={{marginRight: '10px'}}> Planet Name </span> {this.state.SortColumn != "Planet Name" ? <SortOrderNone/> : this.state.SortDirection == "ASC" ? <SortOrderAsc/> : <SortOrderDesc/> } </div></TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {this.state.People.map((row) => (
                  <TableRow className={this.state.TableDataLoading ? "blurryText" : "none"}>
                    <TableCell Sticky style={{ left: 0, position: 'sticky'}} align="center">{row.name}</TableCell>
                    <TableCell align="center">{row.height}</TableCell>
                    <TableCell align="center">{row.mass}</TableCell>
                    <TableCell align="center">{row.created.replace("T", " ").replace("Z", " ").slice(0, -8)}</TableCell>
                    <TableCell align="center">{row.edited.replace("T", " ").replace("Z", " ").slice(0, -8)}</TableCell>
                    <TableCell style={{height:'33px'}} align="center">
                    {row.homeworld_is_loaded ?
                      <div style={{color: this.state.TableDataLoading || row.homeworld_name == "unknown" ? 'gray' : "blue", pointerEvents: this.state.TableDataLoading ? 'none' : "auto"}} className={row.homeworld_name != "unknown" ? "clickable_link" : ""}> <span onClick={(e) => this.OpenPlanetPopup(row.homeworld, row.homeworld_name)} style={{paddingTop:"2px", paddingRight:'12px'}}> {row.homeworld_name} </span> <LaunchIcon style={{display: row.homeworld_name == "unknown" ? 'none' : 'inline-flex'}}/> </div>
                      :
                        <span style={{height:'33px'}}> <CircularProgress size={"25px"}/> </span>
                    }
                    </TableCell>
                  </TableRow>
                ))}

              </TableBody>
            </Table>


          </TableContainer>

          <div id="navigationElement" style={{display:'inline-flex'}}>
            <div>Displaying <b> {this.state.People.length > 0 ? this.state.LowerRange.toLocaleString() : 0} </b> - <b>{this.state.HigherRange.toLocaleString()}</b> out of <b>{this.state.TotalPeopleCount.toLocaleString()}</b> People </div>
            <span style={{marginLeft: `5px`}}> <IconButton style={{color: this.state.TableDataLoading ? 'gray' : "black", pointerEvents: this.state.TableDataLoading ? 'none' : "auto"}} onClick={(e) => this.setState({SearchDialogOpen: !this.state.TableDataLoading ? true : false})}>

            {this.state.SearchFilter.length != 0 ?
            <Badge
            style={{color: this.state.TableDataLoading ? 'gray' : "black", pointerEvents: this.state.TableDataLoading ? 'none' : "auto"}}
              badgeContent={`ON`}
              color={`success`}>
              <FilterListIcon style={{color: this.state.TableDataLoading ? 'gray' : "black", pointerEvents: this.state.TableDataLoading ? 'none' : "auto"}}/>
            </Badge> : null}

            {this.state.SearchFilter.length == 0 ? <FilterListIcon style={{color: this.state.TableDataLoading ? 'gray' : "black", pointerEvents: this.state.TableDataLoading ? 'none' : "auto"}}/> : null}

            </IconButton> </span>
          </div>
          </span>

          <span style={{marginTop:"50px", textAlign:'center', display: this.state.People.length == 0 && this.state.InitialFetchComplete && !this.state.TableDataLoading ? 'block' : "none"}}>
            <h3>No results found</h3>
            <p>Try adjusting the search filter to find what you are looking for.</p>
            <Button onClick={(e) => this.setState({SearchDialogOpen: true})} style={{textTransform: 'none'}} variant="contained">Adjust filter</Button>

          </span>

        </div>

        {this.state.SearchDialogOpen ? <SearchDialog Name={this.state.SearchFilter} ApplyFilter={this.ApplyFilter} HandleDialogClose={this.HandleDialogClose}  /> : null}
        {this.state.PlanetPopupOpen ? <PlanetPopup HandleDialogClose={this.HandlePopupClose} Name={this.state.OpenedPlanetName} Planet_ID={this.state.OpenedPlanetID}  /> : null}


      </div>
    );
  }


}

export default People;
