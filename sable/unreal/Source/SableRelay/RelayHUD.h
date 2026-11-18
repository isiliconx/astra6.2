#pragma once
#include "CoreMinimal.h"
#include "GameFramework/HUD.h"
#include "RelayHUD.generated.h"

class ARelayGameMode;
class ARelayPilot;
class ARelayRoom;

UCLASS()
class SABLERELAY_API ARelayHUD : public AHUD
{
    GENERATED_BODY()
public:
    virtual void DrawHUD() override;
private:
    void Chart(const ARelayRoom& Room,const ARelayPilot& Pilot,float X,float Y,float Width);
};
