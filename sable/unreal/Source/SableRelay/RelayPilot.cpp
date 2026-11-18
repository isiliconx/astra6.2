#include "RelayPilot.h"
#include "RelayGameMode.h"
#include "RelayRoom.h"
#include "Engine/World.h"
#include "Camera/CameraComponent.h"
#include "Components/CapsuleComponent.h"
#include "Components/InputComponent.h"
#include "GameFramework/CharacterMovementComponent.h"

ARelayPilot::ARelayPilot()
{
    GetCapsuleComponent()->InitCapsuleSize(29,88);
    Lens=CreateDefaultSubobject<UCameraComponent>(TEXT("Viewfinder"));
    Lens->SetupAttachment(GetCapsuleComponent()); Lens->SetRelativeLocation(FVector(0,0,78));
    Lens->bUsePawnControlRotation=true; Lens->FieldOfView=83.f;
    bUseControllerRotationYaw=true; bUseControllerRotationPitch=false;
    GetCharacterMovement()->MaxWalkSpeed=345.f;
    GetCharacterMovement()->MaxStepHeight=24.f; GetCharacterMovement()->MaxAcceleration=1700.f;
}
void ARelayPilot::SetupPlayerInputComponent(UInputComponent* Input)
{
    Super::SetupPlayerInputComponent(Input);
    Input->BindAxis(TEXT("MoveForward"),this,&ARelayPilot::Walk);
    Input->BindAxis(TEXT("MoveSide"),this,&ARelayPilot::Strafe);
    Input->BindAxis(TEXT("Turn"),this,&ARelayPilot::Turn); Input->BindAxis(TEXT("Look"),this,&ARelayPilot::Look);
    Input->BindAction(TEXT("Use"),IE_Pressed,this,&ARelayPilot::Use);
    Input->BindAction(TEXT("Reverse"),IE_Pressed,this,&ARelayPilot::Reverse);
    Input->BindAction(TEXT("ResetChamber"),IE_Pressed,this,&ARelayPilot::Reset);
    Input->BindAction(TEXT("Plan"),IE_Pressed,this,&ARelayPilot::Plan);
}
void ARelayPilot::Walk(float V) { AddMovementInput(GetActorForwardVector(),V); }
void ARelayPilot::Strafe(float V) { AddMovementInput(GetActorRightVector(),V); }
void ARelayPilot::Turn(float V) { AddControllerYawInput(V); }
void ARelayPilot::Look(float V) { AddControllerPitchInput(V); }
void ARelayPilot::Use() { RotateClosest(1); }
void ARelayPilot::Reverse() { RotateClosest(-1); }
void ARelayPilot::Reset() { if(auto* GM=GetWorld()->GetAuthGameMode<ARelayGameMode>()) GM->ResetChamber(); }
void ARelayPilot::Plan() { bPlan=!bPlan; }
int32 ARelayPilot::Focus() const
{
    auto* GM=GetWorld()->GetAuthGameMode<ARelayGameMode>();
    return GM && GM->Room() && !GM->IsFinished()?GM->Room()->FocusedMirror(Lens->GetComponentLocation(),Lens->GetForwardVector()):INDEX_NONE;
}
void ARelayPilot::RotateClosest(int32 Delta)
{
    if(auto* GM=GetWorld()->GetAuthGameMode<ARelayGameMode>())
        if(GM->Room() && !GM->IsFinished()) GM->Room()->TurnMirror(Focus(),Delta);
}
