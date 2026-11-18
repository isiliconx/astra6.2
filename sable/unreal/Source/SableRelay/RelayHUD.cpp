#include "RelayHUD.h"
#include "RelayRoom.h"
#include "RelayPilot.h"
#include "RelayGameMode.h"
#include "Engine/Canvas.h"
#include "Engine/Engine.h"
#include "Engine/World.h"
#include "GameFramework/PlayerController.h"

namespace
{
    const FLinearColor Ink{.024f,.027f,.036f,.92f}, Paper{.96f,.89f,.72f,1.f},
        Muted{.64f,.68f,.67f,1.f}, Green{.24f,1.f,.77f,1.f}, Gold{1.f,.65f,.20f,1.f}, Blue{.34f,.69f,1.f,1.f};
}
void ARelayHUD::DrawHUD()
{
    Super::DrawHUD();
    if(!Canvas || !GEngine || !PlayerOwner) return;
    auto* gm=GetWorld()->GetAuthGameMode<ARelayGameMode>();
    auto* pilot=Cast<ARelayPilot>(PlayerOwner->GetPawn());
    if(!gm || !gm->Room() || !pilot) return;
    const auto* room=gm->Room(); const auto& c=room->Optics(); const auto& paths=room->Beams();
    const float w=Canvas->SizeX,h=Canvas->SizeY, s=FMath::Clamp(w/1450.f,.68f,1.36f);
    const float margin=26*s; UFont* font=GEngine->GetMediumFont();
    auto label=[&](const FString& t,FLinearColor color,float x,float y,float scale)
        { DrawText(t,color,x,y,font,scale*s); };
    if(gm->IsFinished())
    {
        const float box=FMath::Min(w-2*margin,500*s), x=(w-box)*.5f, y=h*.37f;
        DrawRect(Ink,x,y,box,169*s); DrawRect(Green,x,y,4*s,169*s);
        label(TEXT("SABLE RELAY     /     SIGNAL LOG"),Gold,x+20*s,y+14*s,.82);
        label(TEXT("Transmission received."),Paper,x+20*s,y+38*s,1.68);
        label(FString::Printf(TEXT("03 / 03 chambers     %d rotations     %02d:%02d"),
            gm->TotalTurns(),int32(gm->Elapsed())/60,int32(gm->Elapsed())%60),Muted,x+20*s,y+87*s,.95);
        label(TEXT("[R]  Start a new circuit"),Green,x+20*s,y+126*s,1.f);
        return;
    }
    DrawRect(Ink,margin,margin,305*s,86*s); DrawRect(Gold,margin,margin,3*s,86*s);
    label(TEXT("SABLE RELAY    /    OPTICAL SURVEY"),Gold,margin+15*s,margin+9*s,.76f);
    label(FString::Printf(TEXT("%02d    %s"),room->Index()+1,UTF8_TO_TCHAR(c.name)),Paper,margin+14*s,margin+28*s,1.30f);
    int32 lit=0; for(int i=0;i<c.targets;++i) lit+=paths.lit[i]?1:0;
    label(FString::Printf(TEXT("%d / %d RECEIVERS    |    %02d TURNS"),lit,c.targets,room->Rotations()),
          room->IsOpen()?Green:Muted,margin+15*s,margin+63*s,.75f);
    const float cx=w*.5f,cy=h*.5f;
    DrawRect(Paper,cx-1,cy-1,2,2);
    const int f=pilot->Focus();
    const TCHAR* brief=room->Index()==0?TEXT("Find mirror A. Bend the beam into the far receiver."):
                       room->Index()==1?TEXT("Make two turns. Follow the light from A to B."):
                                        TEXT("Cross the two beams. Keep both receivers lit.");
    FString instruction=brief;
    if(f!=INDEX_NONE) instruction=FString::Printf(TEXT("Mirror %c    |    %.1f deg     [E] +    [Q] -"),TCHAR('A'+f),c.m[f].step*22.5);
    if(room->IsOpen()) instruction=TEXT("Gate powered. Walk through the north arch.");
    const float by=h-margin-68*s;
    DrawRect(Ink,margin,by,FMath::Min(w-margin*2,514*s),68*s);
    label(instruction,room->IsOpen()?Green:Paper,margin+13*s,by+9*s,.96f);
    label(TEXT("WASD  Walk      Mouse  Look      Tab  Plan      R  Reset"),Muted,margin+13*s,by+39*s,.76f);
    if(pilot->HasPlan()) Chart(*room,*pilot,w-margin-244*s,margin,244*s);
}
void ARelayHUD::Chart(const ARelayRoom& room,const ARelayPilot& pilot,float x,float y,float width)
{
    const float unit=width/20.f, ph=26*unit;
    DrawRect(Ink,x,y,width,ph);
    const auto pos=[&](relay::V2 p){ return FVector2D(x+width*.5+p.x*unit,y+ph*.5-p.y*unit); };
    const auto line=[&](FVector2D a,FVector2D b,FLinearColor ink,float thick)
        { DrawLine(a.X,a.Y,b.X,b.Y,ink,thick); };
    const auto dot=[&](FVector2D p,float r,FLinearColor ink) { DrawRect(ink,p.X-r,p.Y-r,2*r,2*r); };
    const FLinearColor grid{.21f,.25f,.28f,1.f};
    for(int i=-8;i<=8;i+=2) line(pos({double(i),-11}),pos({double(i),11}),grid,1);
    for(int i=-11;i<=11;i+=2) line(pos({-8,double(i)}),pos({8,double(i)}),grid,1);
    const auto& c=room.Optics(); const auto& rays=room.Beams();
    for(int i=0;i<rays.count;++i) line(pos(rays.lines[i].from),pos(rays.lines[i].to),rays.lines[i].channel?Blue:Green,1.75f);
    for(int i=0;i<c.sources;++i) dot(pos(c.e[i].p),3,Green);
    for(int i=0;i<c.targets;++i) { dot(pos(c.r[i]),4,rays.lit[i]?Green:Gold); dot(pos(c.r[i]),1.5f,Ink); }
    for(int i=0;i<c.mirrors;++i)
    {
        const auto d=relay::tangent(c.m[i].step)*.9;
        line(pos(c.m[i].p-d),pos(c.m[i].p+d),Paper,3);
    }
    const FVector p=pilot.GetActorLocation(), f=pilot.GetActorForwardVector();
    const relay::V2 center{p.Y/100.,p.X/100.}, facing{f.Y,f.X}, right{f.X,-f.Y};
    const auto head=pos(center+facing*.62), tail=pos(center-facing*.3+right*.28), other=pos(center-facing*.3-right*.28);
    line(head,tail,Gold,2); line(tail,other,Gold,2); line(other,head,Gold,2);
    line(pos({-1.,10.3}),pos({1.,10.3}),room.IsOpen()?Green:Gold,4);
}
