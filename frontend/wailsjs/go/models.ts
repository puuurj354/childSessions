export namespace model {
	
	export class Flashcard {
	    ID: number;
	    CreatedAt: time.Time;
	    UpdatedAt: time.Time;
	    // Go type: gorm
	    DeletedAt: any;
	    Category: string;
	    TextContent: string;
	    ImagePath: string;
	    Description: string;
	    SessionFlashcards: SessionFlashcard[];
	
	    static createFrom(source: any = {}) {
	        return new Flashcard(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.ID = source["ID"];
	        this.CreatedAt = this.convertValues(source["CreatedAt"], time.Time);
	        this.UpdatedAt = this.convertValues(source["UpdatedAt"], time.Time);
	        this.DeletedAt = this.convertValues(source["DeletedAt"], null);
	        this.Category = source["Category"];
	        this.TextContent = source["TextContent"];
	        this.ImagePath = source["ImagePath"];
	        this.Description = source["Description"];
	        this.SessionFlashcards = this.convertValues(source["SessionFlashcards"], SessionFlashcard);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class SessionFlashcard {
	    ID: number;
	    CreatedAt: time.Time;
	    UpdatedAt: time.Time;
	    // Go type: gorm
	    DeletedAt: any;
	    SessionID: number;
	    Session: Session;
	    FlashcardID: number;
	    Flashcard: Flashcard;
	    ResponseTag: string;
	    ResponseNotes: string;
	    Timestamp: time.Time;
	
	    static createFrom(source: any = {}) {
	        return new SessionFlashcard(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.ID = source["ID"];
	        this.CreatedAt = this.convertValues(source["CreatedAt"], time.Time);
	        this.UpdatedAt = this.convertValues(source["UpdatedAt"], time.Time);
	        this.DeletedAt = this.convertValues(source["DeletedAt"], null);
	        this.SessionID = source["SessionID"];
	        this.Session = this.convertValues(source["Session"], Session);
	        this.FlashcardID = source["FlashcardID"];
	        this.Flashcard = this.convertValues(source["Flashcard"], Flashcard);
	        this.ResponseTag = source["ResponseTag"];
	        this.ResponseNotes = source["ResponseNotes"];
	        this.Timestamp = this.convertValues(source["Timestamp"], time.Time);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class Note {
	    ID: number;
	    CreatedAt: time.Time;
	    UpdatedAt: time.Time;
	    // Go type: gorm
	    DeletedAt: any;
	    SessionID: number;
	    Session: Session;
	    NoteText: string;
	    Category: string;
	    Timestamp: time.Time;
	    IsEncrypted: boolean;
	
	    static createFrom(source: any = {}) {
	        return new Note(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.ID = source["ID"];
	        this.CreatedAt = this.convertValues(source["CreatedAt"], time.Time);
	        this.UpdatedAt = this.convertValues(source["UpdatedAt"], time.Time);
	        this.DeletedAt = this.convertValues(source["DeletedAt"], null);
	        this.SessionID = source["SessionID"];
	        this.Session = this.convertValues(source["Session"], Session);
	        this.NoteText = source["NoteText"];
	        this.Category = source["Category"];
	        this.Timestamp = this.convertValues(source["Timestamp"], time.Time);
	        this.IsEncrypted = source["IsEncrypted"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class Goal {
	    ID: number;
	    CreatedAt: time.Time;
	    UpdatedAt: time.Time;
	    // Go type: gorm
	    DeletedAt: any;
	    ChildID: number;
	    Child: Child;
	    Name: string;
	    Description: string;
	    TargetValue: number;
	    TargetType: string;
	    StartDate: time.Time;
	    EndDate?: time.Time;
	    IsAchieved: boolean;
	    AchievedDate?: time.Time;
	
	    static createFrom(source: any = {}) {
	        return new Goal(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.ID = source["ID"];
	        this.CreatedAt = this.convertValues(source["CreatedAt"], time.Time);
	        this.UpdatedAt = this.convertValues(source["UpdatedAt"], time.Time);
	        this.DeletedAt = this.convertValues(source["DeletedAt"], null);
	        this.ChildID = source["ChildID"];
	        this.Child = this.convertValues(source["Child"], Child);
	        this.Name = source["Name"];
	        this.Description = source["Description"];
	        this.TargetValue = source["TargetValue"];
	        this.TargetType = source["TargetType"];
	        this.StartDate = this.convertValues(source["StartDate"], time.Time);
	        this.EndDate = this.convertValues(source["EndDate"], time.Time);
	        this.IsAchieved = source["IsAchieved"];
	        this.AchievedDate = this.convertValues(source["AchievedDate"], time.Time);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class Reward {
	    ID: number;
	    CreatedAt: time.Time;
	    UpdatedAt: time.Time;
	    // Go type: gorm
	    DeletedAt: any;
	    ChildID: number;
	    Child: Child;
	    SessionID?: number;
	    Session: Session;
	    Type: string;
	    Value: number;
	    Timestamp: time.Time;
	    Notes: string;
	
	    static createFrom(source: any = {}) {
	        return new Reward(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.ID = source["ID"];
	        this.CreatedAt = this.convertValues(source["CreatedAt"], time.Time);
	        this.UpdatedAt = this.convertValues(source["UpdatedAt"], time.Time);
	        this.DeletedAt = this.convertValues(source["DeletedAt"], null);
	        this.ChildID = source["ChildID"];
	        this.Child = this.convertValues(source["Child"], Child);
	        this.SessionID = source["SessionID"];
	        this.Session = this.convertValues(source["Session"], Session);
	        this.Type = source["Type"];
	        this.Value = source["Value"];
	        this.Timestamp = this.convertValues(source["Timestamp"], time.Time);
	        this.Notes = source["Notes"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class Child {
	    ID: number;
	    CreatedAt: time.Time;
	    UpdatedAt: time.Time;
	    // Go type: gorm
	    DeletedAt: any;
	    Name: string;
	    DateOfBirth?: time.Time;
	    Gender: string;
	    ParentGuardianName: string;
	    ContactInfo: string;
	    InitialAssessment: string;
	    Sessions: Session[];
	    Rewards: Reward[];
	    Goals: Goal[];
	
	    static createFrom(source: any = {}) {
	        return new Child(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.ID = source["ID"];
	        this.CreatedAt = this.convertValues(source["CreatedAt"], time.Time);
	        this.UpdatedAt = this.convertValues(source["UpdatedAt"], time.Time);
	        this.DeletedAt = this.convertValues(source["DeletedAt"], null);
	        this.Name = source["Name"];
	        this.DateOfBirth = this.convertValues(source["DateOfBirth"], time.Time);
	        this.Gender = source["Gender"];
	        this.ParentGuardianName = source["ParentGuardianName"];
	        this.ContactInfo = source["ContactInfo"];
	        this.InitialAssessment = source["InitialAssessment"];
	        this.Sessions = this.convertValues(source["Sessions"], Session);
	        this.Rewards = this.convertValues(source["Rewards"], Reward);
	        this.Goals = this.convertValues(source["Goals"], Goal);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class Session {
	    ID: number;
	    CreatedAt: time.Time;
	    UpdatedAt: time.Time;
	    // Go type: gorm
	    DeletedAt: any;
	    ChildID: number;
	    Child: Child;
	    StartTime: time.Time;
	    EndTime?: time.Time;
	    DurationMinutes: number;
	    SummaryNotes: string;
	    Notes: Note[];
	    SessionActivities: SessionActivity[];
	    SessionFlashcards: SessionFlashcard[];
	    Rewards: Reward[];
	
	    static createFrom(source: any = {}) {
	        return new Session(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.ID = source["ID"];
	        this.CreatedAt = this.convertValues(source["CreatedAt"], time.Time);
	        this.UpdatedAt = this.convertValues(source["UpdatedAt"], time.Time);
	        this.DeletedAt = this.convertValues(source["DeletedAt"], null);
	        this.ChildID = source["ChildID"];
	        this.Child = this.convertValues(source["Child"], Child);
	        this.StartTime = this.convertValues(source["StartTime"], time.Time);
	        this.EndTime = this.convertValues(source["EndTime"], time.Time);
	        this.DurationMinutes = source["DurationMinutes"];
	        this.SummaryNotes = source["SummaryNotes"];
	        this.Notes = this.convertValues(source["Notes"], Note);
	        this.SessionActivities = this.convertValues(source["SessionActivities"], SessionActivity);
	        this.SessionFlashcards = this.convertValues(source["SessionFlashcards"], SessionFlashcard);
	        this.Rewards = this.convertValues(source["Rewards"], Reward);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class SessionActivity {
	    ID: number;
	    CreatedAt: time.Time;
	    UpdatedAt: time.Time;
	    // Go type: gorm
	    DeletedAt: any;
	    SessionID: number;
	    Session: Session;
	    ActivityID: number;
	    Activity: Activity;
	    StartTime?: time.Time;
	    EndTime?: time.Time;
	    Notes: string;
	
	    static createFrom(source: any = {}) {
	        return new SessionActivity(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.ID = source["ID"];
	        this.CreatedAt = this.convertValues(source["CreatedAt"], time.Time);
	        this.UpdatedAt = this.convertValues(source["UpdatedAt"], time.Time);
	        this.DeletedAt = this.convertValues(source["DeletedAt"], null);
	        this.SessionID = source["SessionID"];
	        this.Session = this.convertValues(source["Session"], Session);
	        this.ActivityID = source["ActivityID"];
	        this.Activity = this.convertValues(source["Activity"], Activity);
	        this.StartTime = this.convertValues(source["StartTime"], time.Time);
	        this.EndTime = this.convertValues(source["EndTime"], time.Time);
	        this.Notes = source["Notes"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class Activity {
	    ID: number;
	    CreatedAt: time.Time;
	    UpdatedAt: time.Time;
	    // Go type: gorm
	    DeletedAt: any;
	    Name: string;
	    Description: string;
	    DefaultDurationMinutes: number;
	    Category: string;
	    Objectives: string;
	    SessionActivities: SessionActivity[];
	
	    static createFrom(source: any = {}) {
	        return new Activity(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.ID = source["ID"];
	        this.CreatedAt = this.convertValues(source["CreatedAt"], time.Time);
	        this.UpdatedAt = this.convertValues(source["UpdatedAt"], time.Time);
	        this.DeletedAt = this.convertValues(source["DeletedAt"], null);
	        this.Name = source["Name"];
	        this.Description = source["Description"];
	        this.DefaultDurationMinutes = source["DefaultDurationMinutes"];
	        this.Category = source["Category"];
	        this.Objectives = source["Objectives"];
	        this.SessionActivities = this.convertValues(source["SessionActivities"], SessionActivity);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	
	
	
	export class NoteTemplate {
	    ID: number;
	    CreatedAt: time.Time;
	    UpdatedAt: time.Time;
	    // Go type: gorm
	    DeletedAt: any;
	    TemplateText: string;
	    CategoryHint: string;
	    Keywords: string;
	
	    static createFrom(source: any = {}) {
	        return new NoteTemplate(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.ID = source["ID"];
	        this.CreatedAt = this.convertValues(source["CreatedAt"], time.Time);
	        this.UpdatedAt = this.convertValues(source["UpdatedAt"], time.Time);
	        this.DeletedAt = this.convertValues(source["DeletedAt"], null);
	        this.TemplateText = source["TemplateText"];
	        this.CategoryHint = source["CategoryHint"];
	        this.Keywords = source["Keywords"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	export class Schedule {
	    ID: number;
	    CreatedAt: time.Time;
	    UpdatedAt: time.Time;
	    // Go type: gorm
	    DeletedAt: any;
	    ChildID: number;
	    Child: Child;
	    ActivityID?: number;
	    Activity?: Activity;
	    ScheduledDate: time.Time;
	    ScheduledTime: string;
	    DurationMinutes: number;
	    Notes: string;
	    RecurrencePattern: string;
	    RecurrenceEndDate?: time.Time;
	    IsCompleted: boolean;
	    CompletedAt?: time.Time;
	    Reminder: boolean;
	    ReminderMinutes: number;
	
	    static createFrom(source: any = {}) {
	        return new Schedule(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.ID = source["ID"];
	        this.CreatedAt = this.convertValues(source["CreatedAt"], time.Time);
	        this.UpdatedAt = this.convertValues(source["UpdatedAt"], time.Time);
	        this.DeletedAt = this.convertValues(source["DeletedAt"], null);
	        this.ChildID = source["ChildID"];
	        this.Child = this.convertValues(source["Child"], Child);
	        this.ActivityID = source["ActivityID"];
	        this.Activity = this.convertValues(source["Activity"], Activity);
	        this.ScheduledDate = this.convertValues(source["ScheduledDate"], time.Time);
	        this.ScheduledTime = source["ScheduledTime"];
	        this.DurationMinutes = source["DurationMinutes"];
	        this.Notes = source["Notes"];
	        this.RecurrencePattern = source["RecurrencePattern"];
	        this.RecurrenceEndDate = this.convertValues(source["RecurrenceEndDate"], time.Time);
	        this.IsCompleted = source["IsCompleted"];
	        this.CompletedAt = this.convertValues(source["CompletedAt"], time.Time);
	        this.Reminder = source["Reminder"];
	        this.ReminderMinutes = source["ReminderMinutes"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	

}

export namespace time {
	
	export class Time {
	
	
	    static createFrom(source: any = {}) {
	        return new Time(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	
	    }
	}

}

