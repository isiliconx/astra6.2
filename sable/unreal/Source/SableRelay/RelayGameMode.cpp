#include "RelayGameMode.h"
#include "RelayRoom.h"
#include "RelayPilot.h"
#include "RelayHUD.h"
#include "Engine/World.h"
#include "GameFramework/PlayerController.h"
#include "GameFramework/CharacterMovementComponent.h"

namespace
{
    FTransform StartPose(int32 Level)
    {
        const double Azimuths[]={-.08,-.25,-.12};
        return FTransform(FRotator(0,FMath::RadiansToDegrees(Azimuths[FMath::Clamp(Level,0,2)]),0),
                          FVector(-870.,-50.,94.));
    }
}
ARelayGameMode::ARelayGameMode()
{
    DefaultPawnClass=ARelayPilot::StaticClass(); HUDClass=ARelayHUD::StaticClass();
    PrimaryActorTick.bCanEverTick=true; PrimaryActorTick.bStartWithTickEnabled=true;
}
void ARelayGameMode::RestartPlayer(AController* NewPlayer)
{
    if(!NewPlayer) return;
    RestartPlayerAtTransform(NewPlayer,StartPose(Instrument?Instrument->Index():0));
}
void ARelayGameMode::StartPlay()
{
    Instrument=GetWorld()->SpawnActor<ARelayRoom>();
    Super::StartPlay();
    PlacePlayer();
}
void ARelayGameMode::PlacePlayer()
{
    auto* PC=GetWorld()->GetFirstPlayerController();
    if(!PC || !PC->GetPawn() || !Instrument) return;
    FTransform Pose=StartPose(Instrument->Index());
    PC->GetPawn()->SetActorLocationAndRotation(Pose.GetLocation(),Pose.Rotator(),false,nullptr,ETeleportType::TeleportPhysics);
    PC->SetControlRotation(Pose.Rotator());
    if(auto* Pilot=Cast<ARelayPilot>(PC->GetPawn())) Pilot->GetCharacterMovement()->StopMovementImmediately();
    PC->SetInputMode(FInputModeGameOnly()); PC->bShowMouseCursor=false;
}
void ARelayGameMode::ResetChamber()
{
    if(!Instrument) return;
    if(bFinished) { bFinished=false; Clock=0; PreviousTurns=0; Instrument->LoadChamber(0); }
    else Instrument->LoadChamber(Instrument->Index());
    PlacePlayer();
}
int32 ARelayGameMode::TotalTurns() const { return PreviousTurns+(Instrument?Instrument->Rotations():0); }
void ARelayGameMode::Tick(float Dt)
{
    Super::Tick(Dt);
    if(!Instrument || bFinished) return;
    Clock+=Dt;
    auto* PC=GetWorld()->GetFirstPlayerController();
    if(!PC || !PC->GetPawn() || !Instrument->IsOnThreshold(PC->GetPawn()->GetActorLocation())) return;
    if(Instrument->Index()==2) { bFinished=true; return; }
    PreviousTurns+=Instrument->Rotations();
    Instrument->LoadChamber(Instrument->Index()+1);
    PlacePlayer();
}
