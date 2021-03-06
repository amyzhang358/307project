import { Component } from '@angular/core';
import { UserProfile } from './users/user-profile';
import { Room } from './rooms/room';
import { SearchResult } from './users/search-result';
import { AngularFireDatabase } from 'angularfire2/database';
import { UserProfileDataService} from './users/user-profile-data.service';
import { RoomsDataService} from './rooms/rooms-data.service';
import { AngularFireList } from 'angularfire2/database';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent {
  title = 'Full-House';
  userProfilService;
  roomsService;
  user;
  roommate;
  allRooms : Array<Room>;
  providerRooms: Array<Room>;
  myRooms: Array<Room>;
  searchResultRoomProviderArray: Array<SearchResult>;
  searchResultRoomMatesArray: Array<SearchResult>;


  constructor(private db: AngularFireDatabase) {
      this.userProfilService = new UserProfileDataService(db);
      this.roomsService = new RoomsDataService(db);
      this.user = new UserProfile();
      this.searchResultRoomProviderArray = [];
      this.searchResultRoomMatesArray= [];
      this.roommate = new UserProfile;
  }

  login(email:string, password:string){
    let allUsers= this.userProfilService.getUserProfiles();
    this.user = allUsers.subscribe(snapshots=>{
      snapshots.forEach(snapshot =>{
        if (snapshot.email == email && snapshot.password == password){
          this.user = snapshot;
          this.getMyRooms(this.user.email);
        }
      })
    })
  }


  logout(){
    this.user = new UserProfile();
    this.searchResultRoomProviderArray = [];
    this.searchResultRoomMatesArray= [];
  }

  // retreive users who offer rooms within your pricerange and city and match at least 1 of your preferences
  findRoomProviders(){
    // load all users
    let allUsers= this.userProfilService.getUserProfiles();
    // process room provider match
    allUsers.subscribe(snapshots=>{

      // Filter users who provide rooms
      let roomProviderArray = [];
      snapshots.forEach(snapshot =>{
        if (snapshot.offerroom ){
          roomProviderArray.push(snapshot);
        }
      })

      // Loop through all room providers
      // Find out seaerch result according to matching algorithm
      let score = 0;
      this.searchResultRoomProviderArray =[];
      for (let i = 0; i < roomProviderArray.length; i++) {
        if(this.user.city == roomProviderArray[i].city ){
          if (this.user.preferedRMage == roomProviderArray[i].preferedRMage){
            score ++;
          }
          if ( (this.user.preferedRMgender == roomProviderArray[i].preferedRMgender)|| (this.user.preferedRMgender=='Any')){
              score ++;
          }
          if ( this.user.preferedRMbedtime == roomProviderArray[i].preferedRMbedtime){
            score ++;
          }
          // if the room provider's has rooms match the preferred pricerange, get 3 points
          for (let j = 0; j < this.allRooms.length; j++) {
            if ( this.allRooms[j].useremail == roomProviderArray[i].email
            && this.allRooms[j].price == this.user.preferedRoomPrice){
              score = score + 3;
            }
          }

          if(score > 0){
            let searchResult = new SearchResult();
            searchResult.matcheremail = roomProviderArray[i].email;
            searchResult.matchscore = score;
            this.searchResultRoomProviderArray.push(searchResult);
            score = 0;
          }

        }
      }
      // Sort the search result array by matchscore
      this.searchResultRoomProviderArray = this.searchResultRoomProviderArray.sort(
          function(a,b){return b.matchscore - a.matchscore});
    })
  }


  // retreive users who are looking for rooms and match at least 1 of your preferences
  findRoomMates(){
    // load all users
    let allUsers= this.userProfilService.getUserProfiles();

    // process room finder match
    allUsers.subscribe(snapshots=>{
      // Filter users who look for rooms
      let roomFinderArray = [];
      snapshots.forEach(snapshot =>{
        if ( !snapshot.offerroom ){
          roomFinderArray.push(snapshot);
        }
      })
      // Loop through all room  finders
      // Find out seaerch result according to matching algorithm
      let score = 0;
      this.searchResultRoomMatesArray =[];
      for (let i = 0; i < roomFinderArray.length; i++) {
        if(this.user.city == roomFinderArray[i].city ){
          if (this.user.preferedRMage == roomFinderArray[i].preferedRMage){
            score ++;
          }
          if ( this.user.preferedRMgender == roomFinderArray[i].preferedRMgender){
              score ++;
          }
          if ( this.user.preferedRMbedtime == roomFinderArray[i].preferedRMbedtime){
              score ++;
          }
          if(score > 0){
            let searchResult = new SearchResult();
            searchResult.matcheremail = roomFinderArray[i].email;
            searchResult.matchscore = score;
            this.searchResultRoomMatesArray.push(searchResult);
          }
          score = 0;
        }
      }
      // Sort the search result array by matchscore
      this.searchResultRoomMatesArray = this.searchResultRoomMatesArray.sort(
          function(a,b){return b.matchscore - a.matchscore});
    })
  }

  // Add a room for rent
  addRoom(address:string, city:string, description: string, pricerange: string){
    let room = new Room();
    room.useremail = this.user.email;
    room.address = address;
    room.price = pricerange;
    room.city = city;
    room.description = description;
    this.roomsService.addRoom(room);
    this.getMyRooms(this.user.email);
  }

  getMyRooms(email:String){
    let rooms = this.roomsService.getRooms();
    rooms.subscribe(snapshots=>{
      this.allRooms = snapshots;
      this.myRooms = [];
      snapshots.forEach(snapshot =>{
        if (snapshot.useremail == email ){
          this.myRooms.push(snapshot);
        }
      })
    })
  }



  dispayProviderRooms(email:string){
    this.providerRooms = this.getRooms(email);
  }
  getRooms(email:string): Array<Room> | any{
    let roomsArray = new Array<Room>();
    for (let i = 0; i < this.allRooms.length; i++) {
      if (this.allRooms[i].useremail == email ){
        roomsArray.push(this.allRooms[i]);
      }
    }
    return roomsArray;
  }

  displayRoommate(matcheremail:string){
    let allUsers= this.userProfilService.getUserProfiles();
    this.user = allUsers.subscribe(snapshots=>{
      snapshots.forEach(snapshot =>{
        if (snapshot.email == matcheremail ){
          this.roommate = snapshot;
        }
      })
    })
  }
  testAddUserProfile(){
      this.user = new UserProfile();
      this.user.email = 'amber@md.com' ;
      this.user.password = '123445';
      this.user.age = '25';
      this.user.gender = 'F';
      this.user.name = 'Amber';
      this.user.offerroom = true;
      this.user.preferedRMage = '25';
      this.user.preferedRMgender ='F';
      this.user.preferedRMbedtime = '24:00';
      this.userProfilService.addUserProfile(this.user);

  }
  testUpdateUserProfile(){

    this.user.email = 'amber@md.com0' ;
    this.user.password = '123445';
    this.user.age = '20';
    this.user.gender = 'F';
    this.user.name = 'Amber';
    this.user.offerroom = true;
    this.user.preferedRMage = '25';
    this.user.preferedRMgender ='F';
    this.user.preferedRMbedtime = '24:00';
    this.userProfilService.updateUserProfile(this.user.key, this.user);
  }
}
