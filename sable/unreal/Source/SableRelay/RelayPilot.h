#pragma once
#include "CoreMinimal.h"
#include "GameFramework/Character.h"
#include "RelayPilot.generated.h"

class UCameraComponent;

UCLASS()
class SABLERELAY_API ARelayPilot : public ACharacter
{
    GENERATED_BODY()
public:
    ARelayPilot();
    virtual void SetupPlayerInputComponent(UInputComponent* Input) override;
    bool HasPlan() const { return bPlan; }
    int32 Focus() const;
private:
    UPROPERTY(VisibleAnywhere) TObjectPtr<UCameraComponent> Lens;
    bool bPlan=false;
    void Walk(float Amount); void Strafe(float Amount);
    void Turn(float Amount); void Look(float Amount);
    void Use(); void Reverse(); void Reset(); void Plan();
    void RotateClosest(int32 Delta);
};
